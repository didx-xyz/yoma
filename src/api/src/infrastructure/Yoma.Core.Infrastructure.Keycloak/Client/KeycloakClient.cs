using FS.Keycloak.RestApiClient.Api;
using FS.Keycloak.RestApiClient.Authentication.Client;
using FS.Keycloak.RestApiClient.Authentication.ClientFactory;
using FS.Keycloak.RestApiClient.Authentication.Flow;
using FS.Keycloak.RestApiClient.Model;
using Flurl;
using Flurl.Http;
using Keycloak.AuthServices.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using System.Net.Http.Headers;
using System.Net;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System.Text;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.IdentityProvider.Models;
using Yoma.Core.Infrastructure.Keycloak.Extensions;
using Yoma.Core.Infrastructure.Keycloak.Models;

namespace Yoma.Core.Infrastructure.Keycloak.Client
{
  public sealed class KeycloakClient : IDisposable, IIdentityProviderClient
  {
    #region Class Variables
    private const string IdentityCookie = "KEYCLOAK_IDENTITY";
    private const string SessionClaim = "sid";
    private const string CookieHeader = "Set-Cookie";
    private const string BearerTokenType = "Bearer";
    private const string AuthorizationError = "error";
    private const string AuthorizationState = "state";
    private const string AuthorizationCode = "code";
    private const string TokenExchangeGrant = "urn:ietf:params:oauth:grant-type:token-exchange";
    private const string AccessTokenType = "urn:ietf:params:oauth:token-type:access_token";
    private const string AuthorizationCodeGrant = "authorization_code";
    private const string OpenIdScope = "openid";
    private const string NonInteractivePrompt = "none";
    private const string PkceMethod = "S256";

    private readonly ILogger<KeycloakClient> _logger;
    private readonly AppSettings _appSettings;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly KeycloakAdminOptions _keycloakAdminOptions;
    private readonly KeycloakAuthenticationOptions _keycloakAuthenticationOptions;
    private readonly AuthenticationHttpClient _httpClient;

    // The SDK token model uses CLR names; OIDC token responses use snake_case.
    private static readonly JsonSerializerSettings TokenSerializerSettings = new()
    {
      ContractResolver = new DefaultContractResolver { NamingStrategy = new SnakeCaseNamingStrategy() }
    };
    #endregion

    #region Constructor
    public KeycloakClient(ILogger<KeycloakClient> logger,
      AppSettings appSettings,
      IEnvironmentProvider environmentProvider,
      KeycloakAdminOptions keycloakAdminOptions,
      KeycloakAuthenticationOptions keycloakAuthenticationOptions)
    {
      _logger = logger;
      _appSettings = appSettings;
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

      if (_logger.IsEnabled(LogLevel.Debug)) _logger.LogDebug("AuthTokenUrl: {url}", _httpClient.AuthTokenUrl);
    }
    #endregion

    #region Public Members
    /// <summary>
    /// Exchanges the authenticated participant's incoming token through Keycloak's standard token
    /// exchange, using KeycloakAdmin.TokenExchange and the existing Keycloak URL/realm. The client
    /// mappings determine the target audience. The admin SDK has no OIDC token-exchange operation.
    /// Returns the same user's token and remaining lifetime for downstream
    /// federation; a rejected exchange never falls back to privileged background access.
    /// </summary>
    public async Task<UserAccessToken> ExchangeUserAccessToken(string accessToken, CancellationToken cancellationToken = default)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
      cancellationToken.ThrowIfCancellationRequested();

      var options = _keycloakAdminOptions.TokenExchange;
      var started = DateTimeOffset.UtcNow;
      using var response = await _keycloakAuthenticationOptions.AuthServerUrl
        .AppendPathSegments("realms", _keycloakAuthenticationOptions.Realm, "protocol", "openid-connect", "token")
        .WithTimeout(TimeSpan.FromSeconds(options.RequestTimeoutSeconds))
        .PostUrlEncodedAsync(new
        {
          grant_type = TokenExchangeGrant,
          client_id = options.ClientId,
          client_secret = options.ClientSecret,
          subject_token = accessToken,
          subject_token_type = AccessTokenType,
          requested_token_type = AccessTokenType
        }, cancellationToken: cancellationToken)
        .EnsureSuccessStatusCodeAsync();

      return await ReadUserAccessToken(response, started);
    }

    public bool IsClientActingOnBehalfOfUser(string? clientId)
    {
      // This client acquires assertions for integrations; its events are not youth activity.
      // A confidential client or service-account capability alone does not establish that distinction.
      var assertionClientId = _keycloakAdminOptions.TokenExchange?.ClientId;
      return !string.IsNullOrWhiteSpace(clientId) && !string.IsNullOrWhiteSpace(assertionClientId) &&
        string.Equals(clientId, assertionClientId, StringComparison.Ordinal);
    }

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

    /// <summary>
    /// Uses the existing admin integration to create an isolated, temporary user session and
    /// redeem a PKCE authorization code without a browser or participant password. This is not
    /// legacy token exchange. Cleanup deletes only this session, never the user's other logins.
    /// </summary>
    public async Task<UserAccessToken> GetUserAccessToken(Guid id, CancellationToken cancellationToken = default)
    {
      if (id == Guid.Empty) throw new ArgumentNullException(nameof(id));
      cancellationToken.ThrowIfCancellationRequested();
      var options = _keycloakAdminOptions.TokenExchange;
      ArgumentException.ThrowIfNullOrWhiteSpace(options.RedirectUri);

      // Three acquisition requests plus one independently bounded cleanup request.
      using var acquisition = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
      acquisition.CancelAfter(TimeSpan.FromSeconds(options.RequestTimeoutSeconds * 3d));
      cancellationToken = acquisition.Token;

      if (!Uri.TryCreate(options.RedirectUri, UriKind.Absolute, out var callback) ||
        (callback.Scheme != Uri.UriSchemeHttps && callback.Scheme != Uri.UriSchemeHttp) ||
        !string.IsNullOrEmpty(callback.Query) || !string.IsNullOrEmpty(callback.Fragment))
        throw new InvalidOperationException("An absolute HTTP/HTTPS callback without query or fragment is required");

      var baseUri = _keycloakAuthenticationOptions.AuthServerUrl?.TrimEnd('/')
        ?? throw new InvalidOperationException("The identity provider URL is not configured");
      var realm = _keycloakAuthenticationOptions.Realm;
      var cookies = new CookieJar();
      string? sessionId = null;
      var completed = false;

      // Keep privileged operations on the SDK's authenticated API clients. Ordinary Flurl
      // authorization requests below receive only this isolated session's cookies.
      using var usersApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<UsersApi>(_httpClient);
      using var realmsApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<RealmsAdminApi>(_httpClient);
      try
      {
        using var impersonationTimeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        impersonationTimeout.CancelAfter(TimeSpan.FromSeconds(options.RequestTimeoutSeconds));
        var impersonation = await usersApi.PostUsersImpersonationByUserIdWithHttpInfoAsync(
          realm, id.ToString(), impersonationTimeout.Token);
        // The SDK returns Set-Cookie headers but does not populate its Cookies collection.
        var sessionCookies = new CookieContainer();
        var authorizationUri = new Uri(baseUri.AppendPathSegments("realms", realm, "protocol", "openid-connect", "auth"));
        if (impersonation.Headers.TryGetValue(CookieHeader, out var headers))
          foreach (var header in headers)
            sessionCookies.SetCookies(new Uri(baseUri), header);

        // Use only the cookies returned by this impersonation call on the configured IdP transport.
        // Browser Secure flags may describe the public TLS endpoint while this API uses an internal URL.
        // The authorization request never follows redirects or forwards cookies to the callback.
        foreach (Cookie cookie in sessionCookies.GetAllCookies())
          cookies.AddOrReplace(cookie.Name, cookie.Value, authorizationUri.ToString());

        var identity = cookies.SingleOrDefault(cookie => cookie.Name == IdentityCookie)
          ?? throw new InvalidOperationException("Identity provider did not establish the temporary user session");
        var session = ReadUserTokenClaims(identity.Value);
        sessionId = session.Claims.SingleOrDefault(claim => claim.Type == SessionClaim)?.Value;
        if (string.IsNullOrWhiteSpace(sessionId))
          throw new InvalidOperationException("Temporary identity session has no identifier");

        if (session.Subject != id.ToString())
          throw new InvalidOperationException("Temporary identity session does not belong to the requested user");

        var verifier = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        var challenge = WebEncoders.Base64UrlEncode(SHA256.HashData(Encoding.ASCII.GetBytes(verifier)));
        var state = Convert.ToHexStringLower(RandomNumberGenerator.GetBytes(32));
        using var authorization = await baseUri
          .AppendPathSegments("realms", realm, "protocol", "openid-connect", "auth")
          .SetQueryParams(new
          {
            client_id = options.ClientId,
            redirect_uri = options.RedirectUri,
            response_type = AuthorizationCode,
            scope = OpenIdScope,
            prompt = NonInteractivePrompt,
            state,
            code_challenge = challenge,
            code_challenge_method = PkceMethod
          })
          .WithCookies(cookies)
          .WithAutoRedirect(false)
          .WithTimeout(TimeSpan.FromSeconds(options.RequestTimeoutSeconds))
          .AllowHttpStatus((int)HttpStatusCode.Found)
          .GetAsync(cancellationToken: cancellationToken)
          .EnsureSuccessStatusCodeAsync([HttpStatusCode.Found]);

        var location = authorization.ResponseMessage.Headers.Location;
        if (authorization.StatusCode != (int)HttpStatusCode.Found || location?.IsAbsoluteUri != true ||
          location.GetLeftPart(UriPartial.Path) != callback.GetLeftPart(UriPartial.Path) ||
          !string.IsNullOrEmpty(location.Fragment))
          throw new InvalidOperationException("Identity provider did not return the expected authorization callback");

        var query = QueryHelpers.ParseQuery(location.Query);
        if (query.ContainsKey(AuthorizationError) || !query.TryGetValue(AuthorizationState, out var returnedState) ||
          returnedState.Count != 1 || returnedState[0] != state ||
          !query.TryGetValue(AuthorizationCode, out var code) || code.Count != 1 || string.IsNullOrWhiteSpace(code[0]))
          throw new InvalidOperationException("Identity provider rejected the noninteractive authorization request");

        var started = DateTimeOffset.UtcNow;
        using var response = await baseUri
          .AppendPathSegments("realms", realm, "protocol", "openid-connect", "token")
          .WithTimeout(TimeSpan.FromSeconds(options.RequestTimeoutSeconds))
          .PostUrlEncodedAsync(new
          {
            grant_type = AuthorizationCodeGrant,
            client_id = options.ClientId,
            client_secret = options.ClientSecret,
            redirect_uri = options.RedirectUri,
            code = code[0],
            code_verifier = verifier
          }, cancellationToken: cancellationToken)
          .EnsureSuccessStatusCodeAsync();

        var result = await ReadUserAccessToken(response, started);
        var token = ReadUserTokenClaims(result.AccessToken);
        if (token.Subject != id.ToString() ||
          token.Claims.SingleOrDefault(claim => claim.Type == SessionClaim)?.Value != sessionId ||
          token.ValidTo <= DateTimeOffset.UtcNow.UtcDateTime)
          throw new InvalidOperationException("Identity provider returned an unexpected user access token");

        completed = true;
        return result;
      }
      finally
      {
        cookies.Clear();
        if (sessionId != null)
        {
          try
          {
            // Cleanup has its own bounded token so caller cancellation cannot skip it.
            using var cleanup = new CancellationTokenSource(TimeSpan.FromSeconds(options.RequestTimeoutSeconds));
            try
            {
              await realmsApi.DeleteSessionsBySessionAsync(realm, sessionId, cancellationToken: cleanup.Token);
            }
            catch (FS.Keycloak.RestApiClient.Client.ApiException exception) when (exception.ErrorCode == (int)HttpStatusCode.NotFound)
            {
              // A session already removed by the identity provider needs no further cleanup.
            }
          }
          catch
          {
            if (_logger.IsEnabled(LogLevel.Error))
              _logger.LogError("Failed to end a temporary identity-provider session for user '{userId}'", id);

            // Retain an original acquisition failure; otherwise make unsuccessful cleanup visible.
            if (completed) throw;
          }
        }
      }
    }

    public async Task<User?> GetUserByUsername(string? username)
    {
      username = username?.Trim();
      if (string.IsNullOrEmpty(username))
        throw new ArgumentNullException(nameof(username));

      UserRepresentation? result = null;
      using (var usersApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<UsersApi>(_httpClient))
      {
        result = await RetryHelper.RetryUntilAsync(
          async () =>
          {
            var users = await usersApi.GetUsersAsync(_keycloakAuthenticationOptions.Realm, username: username, exact: true);
            return users.SingleOrDefault();
          },
          exitCondition: user => user != null,
          timeout: TimeSpan.FromSeconds(15),
          retryOnException: false,
          delay: TimeSpan.FromSeconds(1),
          onRetry: attempt =>
          {
            if (_logger.IsEnabled(LogLevel.Debug)) _logger.LogDebug("Retry {attempt}: Retrying retrieval of Keycloak user '{username}' from realm '{realm}'", attempt, username.SanitizeLogValue(), _keycloakAuthenticationOptions.Realm);
          },
          logger: _logger
        );
      }

      if (result == null) return null;

      return result.ToUser();
    }

    public async Task<User?> GetUserById(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      UserRepresentation? result = null;
      using (var usersApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<UsersApi>(_httpClient))
      {
        result = await RetryHelper.RetryUntilAsync(
          async () =>
          {
            try
            {
              return await usersApi.GetUsersByUserIdAsync(_keycloakAuthenticationOptions.Realm, id.ToString());
            }
            catch
            {
              return null; //swallow exception, treat as no result
            }
          },
          exitCondition: user => user != null,
          timeout: TimeSpan.FromSeconds(15),
          retryOnException: false,
          delay: TimeSpan.FromSeconds(1),
          onRetry: attempt =>
          {
            if (_logger.IsEnabled(LogLevel.Debug)) _logger.LogDebug("Retry {attempt}: Retrying retrieval of Keycloak user by ID '{id}' from realm '{realm}'", attempt, id, _keycloakAuthenticationOptions.Realm);
          },
          logger: _logger
        );
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
        FirstName = request.FirstName ?? string.Empty,
        LastName = request.LastName ?? string.Empty,
        Email = request.Email ?? string.Empty,
        EmailVerified = string.IsNullOrEmpty(request.Email) ? null : false, // if specified, set verified to false
        Enabled = true,
        Attributes = [],
        RequiredActions = ["UPDATE_PASSWORD"]
      };

      requestKeycloak.Attributes.SetAttribute(CustomAttributes.PhoneNumber, request.PhoneNumber);
      requestKeycloak.Attributes.SetAttribute(CustomAttributes.PhoneNumberVerified, string.IsNullOrEmpty(request.PhoneNumber) ? null : false.ToString().ToLower()); // if specified, set verified to false
      requestKeycloak.Attributes.SetAttribute(CustomAttributes.Gender, request.Gender);
      requestKeycloak.Attributes.SetAttribute(CustomAttributes.Country, request.Country);
      requestKeycloak.Attributes.SetAttribute(CustomAttributes.Education, request.Education);
      requestKeycloak.Attributes.SetAttribute(CustomAttributes.DateOfBirth, request.DateOfBirth);

      User? result = null;
      try
      {
        using var usersApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<UsersApi>(_httpClient);

        // create the user in Keycloak (credentials will be ignored here)
        await usersApi.PostUsersAsync(_keycloakAuthenticationOptions.Realm, requestKeycloak);

        result = await GetUserByUsername(request.Username) ?? throw new InvalidOperationException($"User '{request.Username}' was not found after creation.");

        // set the password via the official API call
        var credential = new CredentialRepresentation
        {
          Type = "password",
          Value = PasswordHelper.GenerateStrongPassword(),
          Temporary = true
        };

        await usersApi.PutUsersResetPasswordByUserIdAsync(_keycloakAuthenticationOptions.Realm, result.Id.ToString(), credential);

        //add newly registered user to the default "User" role
        await EnsureRoles(result.Id, [Constants.Role_User]);

        // if email is provided, trigger email verification — email is unconfirmed by default; same result as PutUsersExecuteActionsEmailByIdAsync["VERIFY_EMAIL"]
        if (_environmentProvider.Environment != Domain.Core.Environment.Local && !string.IsNullOrEmpty(request.Email))
          await usersApi.PutUsersSendVerifyEmailByUserIdAsync(_keycloakAuthenticationOptions.Realm, result.Id.ToString(), _appSettings.YomaWebClientId);
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

        throw new TechnicalException($"Error creating user '{request.Username}' in Keycloak: {ex.Message}", ex);
      }

      return result;
    }

    /// <summary>
    /// Important: Keycloak's PUT /users/{id} endpoint performs a full update.
    /// Omitting any standard field (e.g., EmailVerified, FirstName) or attribute (e.g., custom fields in `Attributes`)
    /// will result in that field or attribute being cleared on the user.
    /// Therefore, you must first fetch the existing user, preserve all fields and attributes not being updated,
    /// and include them in the final update request.
    /// Reference: https://github.com/keycloak/keycloak/issues/28220
    /// </summary>
    public async Task UpdateUser(UserRequestUpdate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      if (request.VerifyEmail && string.IsNullOrEmpty(request.Email))
        throw new ArgumentNullException(nameof(request), "Email is required when VerifyEmail is true");

      using var usersApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<UsersApi>(_httpClient);
      try
      {
        var kcUser = await usersApi.GetUsersByUserIdAsync(_keycloakAuthenticationOptions.Realm, request.Id.ToString())
          ?? throw new InvalidOperationException($"User '{request.Id}' was not found in Keycloak.");

        var requestKeycloak = new UserRepresentation
        {
          Id = request.Id.ToString(),
          Username = request.Username,
          FirstName = request.FirstName ?? string.Empty,
          LastName = request.LastName ?? string.Empty,
          Email = request.Email ?? string.Empty,
          // set to false if VerifyEmail is requested; else null if no email, otherwise preserve or default to false
          EmailVerified = request.VerifyEmail ? false : string.IsNullOrEmpty(request.Email) ? null : kcUser.EmailVerified ?? false,
          Enabled = kcUser.Enabled,
          Attributes = kcUser.Attributes ?? [],
          RequiredActions = [] //reset required actions
        };

        requestKeycloak.Attributes.SetAttribute(CustomAttributes.PhoneNumber, request.PhoneNumber);

        // if phone number is empty, clear the verified flag (null); else use existing attribute value if present, defaulting to false if not explicitly set
        var phoneNumberVerified = string.IsNullOrEmpty(request.PhoneNumber) ? (bool?)null
          : requestKeycloak.Attributes.TryGetValue(CustomAttributes.PhoneNumberVerified.ToDescription(), out var values)
              && bool.TryParse(values?.FirstOrDefault(), out var parsed)
              && parsed;
        requestKeycloak.Attributes.SetAttribute(CustomAttributes.PhoneNumberVerified, phoneNumberVerified?.ToString().ToLower());

        requestKeycloak.Attributes.SetAttribute(CustomAttributes.Gender, request.Gender);
        requestKeycloak.Attributes.SetAttribute(CustomAttributes.Country, request.Country);
        requestKeycloak.Attributes.SetAttribute(CustomAttributes.Education, request.Education);
        requestKeycloak.Attributes.SetAttribute(CustomAttributes.DateOfBirth, request.DateOfBirth);

        // if updating the phone number, add the "UPDATE_PHONE_NUMBER" action
        if (request.UpdatePhoneNumber) requestKeycloak.RequiredActions.Add("UPDATE_PHONE_NUMBER");

        // add "UPDATE_PASSWORD" to prompt the user to change their password on next login; 
        // applies regardless of whether the user has an email; avoids triggering a reset password email
        if (request.ResetPassword) requestKeycloak.RequiredActions.Add("UPDATE_PASSWORD");

        // update user details in keycloak
        await usersApi.PutUsersByUserIdAsync(_keycloakAuthenticationOptions.Realm, request.Id.ToString(), requestKeycloak);

        // send verify email if required; same result as PutUsersExecuteActionsEmailByIdAsync["VERIFY_EMAIL"]
        if (_environmentProvider.Environment != Domain.Core.Environment.Local && request.VerifyEmail)
          await usersApi.PutUsersSendVerifyEmailByUserIdAsync(_keycloakAuthenticationOptions.Realm, request.Id.ToString(), _appSettings.YomaWebClientId);
      }
      catch (Exception ex)
      {
        throw new TechnicalException($"Error updating user '{request.Id}' in Keycloak: {ex.Message}", ex);
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

      var actions = userRepresentation?.RequiredActions;
      var actionsText = (actions != null && actions.Count > 0) ? string.Join(", ", actions) : NonInteractivePrompt;
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Fetched user representation for user ID: {id} - RequiredActions: {actions}", id, actionsText);

      if (!string.IsNullOrEmpty(userRepresentation?.Email))
      {
        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("No action required for user ID: {id} because email is not empty.", id);
        return;
      }

      if (userRepresentation?.RequiredActions == null || !userRepresentation.RequiredActions.Contains("VERIFY_EMAIL"))
      {
        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("No action required for user ID: {id} because 'VERIFY_EMAIL' is not present in RequiredActions.", id);
        return;
      }

      userRepresentation.RequiredActions.Remove("VERIFY_EMAIL");
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("'VERIFY_EMAIL' action removed for user ID: {id}.", id);

      // Persist the updated user representation
      await userApi.PutUsersByUserIdAsync(_keycloakAuthenticationOptions.Realm, id.ToString(), userRepresentation);
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Updated user representation persisted for user ID: {id}.", id);
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

      var roleRepresentations = roleRepresentationsExisting.RealmMappings?
        .Where(o => roles.Contains(o.Name, StringComparer.OrdinalIgnoreCase)).ToList();

      // Reconciliation can repeat after the role was already removed.
      if (roleRepresentations == null || roleRepresentations.Count == 0) return;

      await rolesMapperApi.DeleteUsersRoleMappingsRealmByUserIdAsync(_keycloakAuthenticationOptions.Realm, id.ToString(), roleRepresentations);
    }

    public async Task<List<User>?> ListByRole(string role)
    {
      if (string.IsNullOrWhiteSpace(role))
        throw new ArgumentNullException(nameof(role));

      if (!Constants.Roles_Supported.Contains(role, StringComparer.OrdinalIgnoreCase))
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

    #region Private Members
    private async Task<UserAccessToken> ReadUserAccessToken(IFlurlResponse response, DateTimeOffset started)
    {
      KeycloakApiToken? result;
      try
      {
        result = JsonConvert.DeserializeObject<KeycloakApiToken>(await response.GetStringAsync(), TokenSerializerSettings);
      }
      catch (JsonException)
      {
        throw new InvalidOperationException("Identity provider returned an invalid token response");
      }

      if (result == null || string.IsNullOrWhiteSpace(result.AccessToken) || result.ExpiresIn <= TimeSpan.Zero ||
        !string.Equals(result.TokenType, BearerTokenType, StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("Identity provider returned an invalid user access token");

      var token = ReadUserTokenClaims(result.AccessToken);
      // Preserve the SDK token model's safety margin and the signed token's earlier deadline.
      var expires = new[] { started.Add(result.ExpiresIn), new DateTimeOffset(token.ValidTo) }.Min();
      if (expires <= DateTimeOffset.UtcNow)
        throw new InvalidOperationException("Identity provider returned an expired user access token");

      return new UserAccessToken
      {
        AccessToken = result.AccessToken,
        ExpiresIn = (int)(expires - DateTimeOffset.UtcNow).TotalSeconds
      };
    }

    private static JwtSecurityToken ReadUserTokenClaims(string value)
    {
      // Tokens came directly from the configured identity provider. Do not include parser errors
      // or token contents in failures; callers separately validate the expected subject/audience.
      try
      {
        return new JwtSecurityTokenHandler().ReadJwtToken(value);
      }
      catch (Exception exception) when (exception is ArgumentException or Microsoft.IdentityModel.Tokens.SecurityTokenException or FormatException)
      {
        throw new InvalidOperationException("Identity provider returned malformed user token claims");
      }
    }
    #endregion
  }
}
