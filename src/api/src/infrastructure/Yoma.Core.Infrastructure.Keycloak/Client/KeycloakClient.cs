using FS.Keycloak.RestApiClient.Api;
using FS.Keycloak.RestApiClient.Authentication.Client;
using FS.Keycloak.RestApiClient.Authentication.ClientFactory;
using FS.Keycloak.RestApiClient.Authentication.Flow;
using FS.Keycloak.RestApiClient.Model;
using Keycloak.AuthServices.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using System.Net.Http.Headers;
using System.Text;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.IdentityProvider.Models;
using Yoma.Core.Infrastructure.Keycloak.Extensions;
using Yoma.Core.Infrastructure.Keycloak.Models;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Infrastructure.Keycloak.Client
{
  public sealed class KeycloakClient : IDisposable, IIdentityProviderClient
  {
    #region Class Variables
    private readonly ILogger<KeycloakClient> _logger;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly KeycloakAdminOptions _keycloakAdminOptions;
    private readonly KeycloakAuthenticationOptions _keycloakAuthenticationOptions;
    private readonly AuthenticationHttpClient _httpClient;
    #endregion

    #region Constructor
    public KeycloakClient(ILogger<KeycloakClient> logger,
      IEnvironmentProvider environmentProvider,
      KeycloakAdminOptions keycloakAdminOptions,
      KeycloakAuthenticationOptions keycloakAuthenticationOptions)
    {
      _logger = logger;
      _environmentProvider = environmentProvider;
      _keycloakAdminOptions = keycloakAdminOptions;
      _keycloakAuthenticationOptions = keycloakAuthenticationOptions;

      var credentials = new PasswordGrantFlow
      {
        KeycloakUrl = _keycloakAuthenticationOptions.AuthServerUrl?.TrimEnd('/'),
        Realm = _keycloakAdminOptions.Admin.Realm,
        UserName = _keycloakAdminOptions.Admin.Username,
        Password = _keycloakAdminOptions.Admin.Password
      };

      _httpClient = AuthenticationHttpClientFactory.Create(credentials);

      _logger.LogDebug("AuthTokenUrl: {url}", _httpClient.AuthTokenUrl);
    }
    #endregion

    #region Public Members
    public bool AuthenticateWebhook(HttpContext httpContext)
    {
      if (httpContext == null)
        throw new ArgumentNullException(nameof(httpContext), $"{nameof(httpContext)} is null");

      // basic authentication
      var headerValue = httpContext.Request.Headers.Authorization;
      if (StringValues.IsNullOrEmpty(headerValue))
        throw new ArgumentNullException(nameof(httpContext), $"{nameof(httpContext.Request.Headers)}.Authorization is null");

      var authHeader = AuthenticationHeaderValue.Parse(headerValue!);

      if (authHeader.Parameter == null)
        throw new ArgumentException($"{nameof(httpContext.Request.Headers)}.Authorization is null", nameof(httpContext));

      var credentialBytes = Convert.FromBase64String(authHeader.Parameter);
      var credentials = Encoding.UTF8.GetString(credentialBytes).Split(':', 2);
      if (credentials.Length != 2)
        throw new ArgumentException($"{nameof(httpContext.Request.Headers)}.Authorization: Invalid credentials format", nameof(httpContext));
      var username = credentials[0];
      var password = credentials[1];

      return username == _keycloakAdminOptions.WebhookAdmin.Username && password == _keycloakAdminOptions.WebhookAdmin.Password;
    }

    public async Task<User?> GetUserByUsername(string? username)
    {
      username = username?.Trim();
      if (string.IsNullOrEmpty(username))
        throw new ArgumentNullException(nameof(username));

      var timeout = TimeSpan.FromSeconds(15);
      var startTime = DateTimeOffset.UtcNow;
      UserRepresentation? result = null;
      using (var usersApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<UsersApi>(_httpClient))
      {
        while (true)
        {
          result = (await usersApi.GetUsersAsync(_keycloakAuthenticationOptions.Realm, username: username, exact: true)).SingleOrDefault();

          if (result != null) break;
          if (DateTimeOffset.UtcNow - startTime >= timeout) break;

          await Task.Delay(1000);
        }
      }

      if (result == null) return null;

      return result.ToUser();
    }

    public async Task<User?> GetUserById(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var timeout = TimeSpan.FromSeconds(15);
      var startTime = DateTimeOffset.UtcNow;
      UserRepresentation? result = null;

      using (var usersApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<UsersApi>(_httpClient))
      {
        while (true)
        {
          try
          {
            result = await usersApi.GetUsersByUserIdAsync(_keycloakAuthenticationOptions.Realm, id.ToString());
          }
          catch { }

          if (result != null) break;
          if (DateTimeOffset.UtcNow - startTime >= timeout) break;

          await Task.Delay(1000);
        }
      }

      if (result == null) return null;

      return result.ToUser();
    }

    /// <summary>
    /// Creates a user in Keycloak using the provided details.
    /// 
    /// Notes:
    /// - `PostUsersAsync` does not persist credentials (`Credentials` field is ignored),
    ///   so password must be set in a separate call after user creation.
    /// - Phone number remains unconfirmed if specified; it will be confirmed automatically on first login via OTP.
    /// - A strong temporary password is assigned and the `UPDATE_PASSWORD` action is explicitly added to enforce
    ///   a password reset on first login, regardless of login method.
    /// - Setting `Temporary = true` alone is not always sufficient for enforcing password change across all login flows;
    ///   `UPDATE_PASSWORD` is required for consistent behavior.
    /// </summary>
    public async Task<User> CreateUser(UserRequestCreate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      var requestKeycloak = new UserRepresentation
      {
        Username = request.Username,
        Email = request.Email ?? string.Empty,
        FirstName = request.FirstName ?? string.Empty,
        LastName = request.LastName ?? string.Empty,
        Enabled = true,
        Attributes = [],
        RequiredActions = ["UPDATE_PASSWORD"]
      };

      if (!string.IsNullOrEmpty(request.PhoneNumber))
        requestKeycloak.Attributes.Add(CustomAttributes.PhoneNumber.ToDescription(), [request.PhoneNumber]);

      if (!string.IsNullOrEmpty(request.Gender))
        requestKeycloak.Attributes.Add(CustomAttributes.Gender.ToDescription(), [request.Gender]);

      if (!string.IsNullOrEmpty(request.Country))
        requestKeycloak.Attributes.Add(CustomAttributes.Country.ToDescription(), [request.Country]);

      if (!string.IsNullOrEmpty(request.Education))
        requestKeycloak.Attributes.Add(CustomAttributes.Education.ToDescription(), [request.Education]);

      if (!string.IsNullOrEmpty(request.DateOfBirth))
        requestKeycloak.Attributes.Add(CustomAttributes.DateOfBirth.ToDescription(), [request.DateOfBirth]);

      requestKeycloak.Attributes.Add(CustomAttributes.TermsAndConditions.ToDescription(), [true.ToString().ToLower()]);

      User? result = null;
      try
      {
        using var userApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<UsersApi>(_httpClient);

        // create the user in Keycloak (credentials will be ignored here)
        await userApi.PostUsersAsync(_keycloakAuthenticationOptions.Realm, requestKeycloak);

        // fetch the created user to retrieve their Keycloak Id
        result = await GetUserByUsername(request.Username);
        if (result == null)
          throw new InvalidOperationException($"User '{request.Username}' was not found after creation.");

        // set the password via the official API call
        var credential = new CredentialRepresentation
        {
          Type = "password",
          Value = PasswordHelper.GenerateStrongPassword(),
          Temporary = true
        };

        await userApi.PutUsersResetPasswordByUserIdAsync(_keycloakAuthenticationOptions.Realm, result.Id.ToString(), credential);

        // if email is provided, trigger email verification — email is unconfirmed by default
        if (_environmentProvider.Environment != Domain.Core.Environment.Local && !string.IsNullOrEmpty(request.Email))
          await userApi.PutUsersSendVerifyEmailByUserIdAsync(_keycloakAuthenticationOptions.Realm, result.Id.ToString()); // same result as PutUsersExecuteActionsEmailByIdAsync["VERIFY_EMAIL"]
      }
      catch (Exception ex)
      {
        if (result != null)
          try
          {
            await DeleteUser(result.Id);
          }
          catch (Exception deleteEx)
          {
            _logger.LogWarning(deleteEx, "Failed to roll back creation of Keycloak user '{username}'", request.Username.SanitizeLogValue());
          }

        throw new TechnicalException($"Error creating user '{request.Username}' in Keycloak", ex);
      }

      return result;
    }

    /// <summary>
    /// Important: Keycloak's PUT /users/{id} endpoint performs a full update.
    /// Omitting fields like EmailVerified or PhoneNumberVerified will result in them being cleared.
    /// Therefore, always include these fields in the update request, even if their values haven't changed.
    /// Reference: https://github.com/keycloak/keycloak/issues/28220
    /// </summary>
    public async Task UpdateUser(UserRequestUpdate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      if (request.VerifyEmail) request.EmailVerified = false;

      var requestKeycloak = new UserRepresentation
      {
        Id = request.Id.ToString(),
        Username = request.Username,
        Email = request.Email ?? string.Empty,
        FirstName = request.FirstName ?? string.Empty,
        LastName = request.LastName ?? string.Empty,
        EmailVerified = request.EmailVerified,
        Attributes = [],
        RequiredActions = []
      };

      // if updating the phone number, add the "UPDATE_PHONE_NUMBER" action
      if (request.UpdatePhoneNumber) requestKeycloak.RequiredActions.Add("UPDATE_PHONE_NUMBER");

      // add "UPDATE_PASSWORD" to prompt the user to change their password on next login; 
      // applies regardless of whether the user has an email; avoids triggering a reset password email
      if (request.ResetPassword) requestKeycloak.RequiredActions.Add("UPDATE_PASSWORD");

      if (!string.IsNullOrEmpty(request.PhoneNumber))
        requestKeycloak.Attributes.Add(CustomAttributes.PhoneNumber.ToDescription(), [request.PhoneNumber]);

      if (!string.IsNullOrEmpty(request.Gender))
        requestKeycloak.Attributes.Add(CustomAttributes.Gender.ToDescription(), [request.Gender]);

      if (!string.IsNullOrEmpty(request.Country))
        requestKeycloak.Attributes.Add(CustomAttributes.Country.ToDescription(), [request.Country]);

      if (!string.IsNullOrEmpty(request.Education))
        requestKeycloak.Attributes.Add(CustomAttributes.Education.ToDescription(), [request.Education]);

      if (!string.IsNullOrEmpty(request.DateOfBirth))
        requestKeycloak.Attributes.Add(CustomAttributes.DateOfBirth.ToDescription(), [request.DateOfBirth]);

      if (request.PhoneNumberVerified.HasValue)
        requestKeycloak.Attributes.Add(CustomAttributes.PhoneNumberVerified.ToDescription(), [request.PhoneNumberVerified.Value.ToString().ToLower()]);

      try
      {
        using var userApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<UsersApi>(_httpClient);

        // update user details in keycloak
        await userApi.PutUsersByUserIdAsync(_keycloakAuthenticationOptions.Realm, request.Id.ToString(), requestKeycloak);

        // send verify email if required
        if (_environmentProvider.Environment != Domain.Core.Environment.Local && request.VerifyEmail)
          await userApi.PutUsersSendVerifyEmailByUserIdAsync(_keycloakAuthenticationOptions.Realm, request.Id.ToString()); // same result as PutUsersExecuteActionsEmailByIdAsync["VERIFY_EMAIL"]

        // if resetting the password and the user has an email, trigger the password reset email action
        // if (request.ResetPassword && request.HasEmail)
        //  await userApi.PutUsersExecuteActionsEmailByUserIdAsync(_keycloakAuthenticationOptions.Realm, request.Id.ToString(), requestBody: ["UPDATE_PASSWORD"]); // admin initiated update password email action (executeActions)
      }
      catch (Exception ex)
      {
        throw new TechnicalException($"Error updating user '{request.Id}' in Keycloak", ex);
      }
    }

    public async Task DeleteUser(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      using var userApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<UsersApi>(_httpClient);

      await userApi.DeleteUsersByUserIdAsync(_keycloakAuthenticationOptions.Realm, id.ToString());
    }

    public async Task EnsureVerifyEmailActionRemovedIfNoEmail(Guid id)
    {
      using var userApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<UsersApi>(_httpClient);

      var userRepresentation = await userApi.GetUsersByUserIdAsync(_keycloakAuthenticationOptions.Realm, id.ToString());
      _logger.LogInformation("Fetched user representation for user ID: {id} - RequiredActions: {actions}", id, string.Join(", ", userRepresentation.RequiredActions ?? Enumerable.Empty<string>()));

      if (!string.IsNullOrEmpty(userRepresentation.Email))
      {
        _logger.LogInformation("No action required for user ID: {id} because email is not empty.", id);
        return;
      }

      if (userRepresentation.RequiredActions == null || !userRepresentation.RequiredActions.Contains("VERIFY_EMAIL"))
      {
        _logger.LogInformation("No action required for user ID: {id} because 'VERIFY_EMAIL' is not present in RequiredActions.", id);
        return;
      }

      userRepresentation.RequiredActions.Remove("VERIFY_EMAIL");
      _logger.LogInformation("'VERIFY_EMAIL' action removed for user ID: {id}.", id);

      // Persist the updated user representation
      await userApi.PutUsersByUserIdAsync(_keycloakAuthenticationOptions.Realm, id.ToString(), userRepresentation);
      _logger.LogInformation("Updated user representation persisted for user ID: {id}.", id);
    }

    public async Task EnsureRoles(Guid id, List<string> roles)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      if (roles == null || roles.Count == 0)
        throw new ArgumentNullException(nameof(roles));

      var rolesInvalid = roles.Except(Constants.Roles_Supported);
      if (rolesInvalid.Any())
        throw new ArgumentOutOfRangeException(nameof(roles), $"Invalid role(s) specified: {string.Join(';', rolesInvalid)}");

      using var rolesApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<RolesApi>(_httpClient);
      using var rolesMapperApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<RoleMapperApi>(_httpClient);

      var kcRoles = await rolesApi.GetRolesAsync(_keycloakAuthenticationOptions.Realm);

      var roleRepresentations = kcRoles.IntersectBy(roles.Select(o => o.ToLower()), o => o.Name.ToLower()).ToList();
      await rolesMapperApi.PostUsersRoleMappingsRealmByUserIdAsync(_keycloakAuthenticationOptions.Realm, id.ToString(), roleRepresentations);
    }

    public async Task RemoveRoles(Guid id, List<string> roles)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      if (roles == null || roles.Count == 0)
        throw new ArgumentNullException(nameof(roles));

      var rolesInvalid = roles.Except(Constants.Roles_Supported);
      if (rolesInvalid.Any())
        throw new ArgumentOutOfRangeException(nameof(roles), $"Invalid role(s) specified: {string.Join(';', rolesInvalid)}");

      using var rolesApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<RolesApi>(_httpClient);
      using var rolesMapperApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<RoleMapperApi>(_httpClient);

      var roleRepresentationsExisting = await rolesMapperApi.GetUsersRoleMappingsByUserIdAsync(_keycloakAuthenticationOptions.Realm, id.ToString());

      var roleRepresentations = roleRepresentationsExisting.RealmMappings.Where(o => roles.Contains(o.Name, StringComparer.InvariantCultureIgnoreCase)).ToList();

      await rolesMapperApi.PostUsersRoleMappingsRealmByUserIdAsync(_keycloakAuthenticationOptions.Realm, id.ToString(), roleRepresentations);
    }

    public async Task<List<User>?> ListByRole(string role)
    {
      if (string.IsNullOrWhiteSpace(role))
        throw new ArgumentNullException(nameof(role));

      if (!Constants.Roles_Supported.Contains(role, StringComparer.InvariantCultureIgnoreCase))
        throw new ArgumentOutOfRangeException(nameof(role), $"Role '{role}' is invalid");

      using var rolesApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<RolesApi>(_httpClient);

      var kcUsers = await rolesApi.GetRolesUsersByRoleNameAsync(_keycloakAuthenticationOptions.Realm, role);
      kcUsers = kcUsers?.Where(o => o.EmailVerified == true).ToList();

      return kcUsers?.Select(o => o.ToUser()).ToList();
    }

    public void Dispose()
    {
      _httpClient?.Dispose();
    }
    #endregion
  }
}
