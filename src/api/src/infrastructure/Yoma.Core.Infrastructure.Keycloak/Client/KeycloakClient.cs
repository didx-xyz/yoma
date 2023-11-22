using FS.Keycloak.RestApiClient.Api;
using FS.Keycloak.RestApiClient.Client;
using Keycloak.AuthServices.Authentication;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core;
using Microsoft.AspNetCore.Http;
using System.Net.Http.Headers;
using System.Text;
using FS.Keycloak.RestApiClient.Model;
using Yoma.Core.Domain.Exceptions;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.IdentityProvider.Models;
using Yoma.Core.Infrastructure.Keycloak.Models;
using Yoma.Core.Infrastructure.Keycloak.Extensions;
using FS.Keycloak.RestApiClient.Authentication.ClientFactory;
using FS.Keycloak.RestApiClient.Authentication.Flow;
using FS.Keycloak.RestApiClient.Authentication.Client;

namespace Yoma.Core.Infrastructure.Keycloak.Client
{
    public sealed class KeycloakClient : IDisposable, IIdentityProviderClient
    {
        #region Class Variables
        private readonly KeycloakAdminOptions _keycloakAdminOptions;
        private readonly KeycloakAuthenticationOptions _keycloakAuthenticationOptions;
        private readonly AuthenticationHttpClient _httpClient;
        #endregion

        #region Constructor
        public KeycloakClient(KeycloakAdminOptions keycloakAdminOptions,
            KeycloakAuthenticationOptions keycloakAuthenticationOptions)
        {
            _keycloakAdminOptions = keycloakAdminOptions;
            _keycloakAuthenticationOptions = keycloakAuthenticationOptions;

            var credentials = new PasswordGrantFlow
            {
                KeycloakUrl = _keycloakAuthenticationOptions.AuthServerUrl,
                Realm = _keycloakAdminOptions.Admin.Realm,
                UserName = _keycloakAdminOptions.Admin.Username,
                Password = _keycloakAdminOptions.Admin.Password
            };

            _httpClient = AuthenticationHttpClientFactory.Create(credentials);
        }
        #endregion

        #region Public Members
        public bool AuthenticateWebhook(HttpContext httpContext)
        {
            if (httpContext == null)
                throw new ArgumentNullException(nameof(httpContext), $"{nameof(httpContext)} is null");

            // basic authentication
            var authHeader = AuthenticationHeaderValue.Parse(httpContext.Request.Headers["Authorization"]);

            if (authHeader.Parameter == null)
                throw new ArgumentNullException(nameof(httpContext), $"{nameof(httpContext.Request.Headers)}.Authorization is null");

            var credentialBytes = Convert.FromBase64String(authHeader.Parameter);
            var credentials = Encoding.UTF8.GetString(credentialBytes).Split(':', 2);
            var username = credentials[0];
            var password = credentials[1];

            return username == _keycloakAdminOptions.WebhookAdmin.Username && password == _keycloakAdminOptions.WebhookAdmin.Password;
        }

        public async Task<User?> GetUser(string? username)
        {
            username = username?.Trim();
            if (string.IsNullOrEmpty(username))
                throw new ArgumentNullException(nameof(username));

            var timeout = 15000;
            var startTime = DateTime.Now;
            UserRepresentation? kcUser = null;
            using (var usersApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<UsersApi>(_httpClient))
            {
                while (true)
                {
                    kcUser = (await usersApi.GetUsersAsync(_keycloakAuthenticationOptions.Realm, username: username, exact: true)).SingleOrDefault();
                    if (kcUser != null) break;

                    if ((DateTime.Now - startTime).TotalMilliseconds >= timeout) break;
                    Thread.Sleep(1000);
                }
            }

            if (kcUser == null) return null;

            return kcUser.ToUser();
        }

        public async Task UpdateUser(User user, bool resetPassword)
        {
            using var userApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<UserApi>(_httpClient);

            var request = new UserRepresentation
            {
                Id = user.Id.ToString(),
                FirstName = user.FirstName,
                LastName = user.LastName,
                Attributes = new Dictionary<string, List<string>>(),
                Username = user.Email,
                Email = user.Email,
                EmailVerified = user.EmailVerified
            };

            if (!string.IsNullOrEmpty(user.PhoneNumber))
                request.Attributes.Add(CustomAttributes.PhoneNumber.ToDescription(), new List<string> { { user.PhoneNumber } });

            if (!string.IsNullOrEmpty(user.Gender))
                request.Attributes.Add(CustomAttributes.Gender.ToDescription(), new List<string> { { user.Gender } });

            if (!string.IsNullOrEmpty(user.CountryOfOrigin))
                request.Attributes.Add(CustomAttributes.CountryOfOrigin.ToDescription(), new List<string> { { user.CountryOfOrigin } });

            if (!string.IsNullOrEmpty(user.CountryOfResidence))
                request.Attributes.Add(CustomAttributes.CountryOfResidence.ToDescription(), new List<string> { { user.CountryOfResidence } });

            if (!string.IsNullOrEmpty(user.DateOfBirth))
                request.Attributes.Add(CustomAttributes.DateOfBirth.ToDescription(), new List<string> { { user.DateOfBirth } });

            try
            {
                // update user details
                await userApi.PutUsersByIdAsync(_keycloakAuthenticationOptions.Realm, user.Id.ToString(), request);

                // send verify email
                if (!user.EmailVerified)
                    await userApi.PutUsersSendVerifyEmailByIdAsync(_keycloakAuthenticationOptions.Realm, user.Id.ToString());

                // send forgot password email
                if (resetPassword)
                    await userApi.PutUsersExecuteActionsEmailByIdAsync(_keycloakAuthenticationOptions.Realm, user.Id.ToString(), requestBody: new List<string> { "UPDATE_PASSWORD" });
            }
            catch (Exception ex)
            {
                throw new TechnicalException($"Error updating user {user.Id} in Keycloak", ex);
            }
        }

        public async Task EnsureRoles(Guid id, List<string> roles)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            if (roles == null || !roles.Any())
                throw new ArgumentNullException(nameof(roles));

            var rolesInvalid = roles.Except(Constants.Roles_Supported);
            if (rolesInvalid.Any())
                throw new ArgumentOutOfRangeException(nameof(roles), $"Invalid role(s) specified: {string.Join(';', rolesInvalid)}");

            using var rolesApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<RoleContainerApi>(_httpClient);
            using var rolesMapperApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<RoleMapperApi>(_httpClient);

            var kcRoles = await rolesApi.GetRolesAsync(_keycloakAuthenticationOptions.Realm);

            var roleRepresentations = kcRoles.IntersectBy(roles.Select(o => o.ToLower()), o => o.Name.ToLower()).ToList();
            await rolesMapperApi.PostUsersRoleMappingsRealmByIdAsync(_keycloakAuthenticationOptions.Realm, id.ToString(), roleRepresentations);
        }

        public async Task RemoveRoles(Guid id, List<string> roles)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            if (roles == null || !roles.Any())
                throw new ArgumentNullException(nameof(roles));

            var rolesInvalid = roles.Except(Constants.Roles_Supported);
            if (rolesInvalid.Any())
                throw new ArgumentOutOfRangeException(nameof(roles), $"Invalid role(s) specified: {string.Join(';', rolesInvalid)}");

            using var rolesApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<RoleContainerApi>(_httpClient);
            using var rolesMapperApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<RoleMapperApi>(_httpClient);

            var roleRepresentationsExisting = await rolesMapperApi.GetUsersRoleMappingsByIdAsync(_keycloakAuthenticationOptions.Realm, id.ToString());

            var roleRepresentations = roleRepresentationsExisting.RealmMappings.Where(o => roles.Contains(o.Name, StringComparer.InvariantCultureIgnoreCase)).ToList();

            await rolesMapperApi.PostUsersRoleMappingsRealmByIdAsync(_keycloakAuthenticationOptions.Realm, id.ToString(), roleRepresentations);
        }

        public async Task<List<User>?> ListByRole(string role)
        {
            if (string.IsNullOrWhiteSpace(role))
                throw new ArgumentNullException(nameof(role));

            if (!Constants.Roles_Supported.Contains(role, StringComparer.InvariantCultureIgnoreCase))
                throw new ArgumentOutOfRangeException(nameof(role), $"Role '{role}' is invalid");

            using var rolesApi = FS.Keycloak.RestApiClient.ClientFactory.ApiClientFactory.Create<RoleContainerApi>(_httpClient);

            var kcUsers = await rolesApi.GetRolesUsersByRoleNameAsync(_keycloakAuthenticationOptions.Realm, role);

            return kcUsers.Select(o => o.ToUser()).ToList();
        }

        public void Dispose()
        {
            _httpClient?.Dispose();
        }
        #endregion
    }
}
