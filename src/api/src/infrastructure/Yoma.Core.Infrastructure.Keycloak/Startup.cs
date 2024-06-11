using Flurl;
using Keycloak.AuthServices.Authentication;
using Keycloak.AuthServices.Authorization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Infrastructure.Keycloak.Client;
using Yoma.Core.Infrastructure.Keycloak.Middleware;
using Yoma.Core.Infrastructure.Keycloak.Models;

namespace Yoma.Core.Infrastructure.Keycloak
{
  public static class Startup
  {
    #region Public Members
    public static void ConfigureServices_IdentityProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.Configure<KeycloakAdminOptions>(options => configuration.GetSection(KeycloakAdminOptions.Section).Bind(options));
      services.Configure<KeycloakAuthenticationOptions>(options => configuration.GetSection(KeycloakAuthenticationOptions.Section).Bind(options));
    }

    public static void ConfigureServices_InfrastructureIdentityProvider(this IServiceCollection services)
    {
      services.AddScoped<IIdentityProviderClientFactory, KeycloakClientFactory>();
    }

    public static void ConfigureServices_AuthenticationIdentityProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.AddKeycloakAuthentication(AuthenticationOptions(configuration));
    }

    public static void ConfigureServices_AuthorizationIdentityProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.AddKeycloakAuthorization(ProtectionClientOptions(configuration));
      services.AddTransient<IClaimsTransformation, KeyCloakClaimsTransformer>();
    }

    public static IIdentityProviderAuthOptions Configuration_IdentityProviderAuthenticationOptions(this IConfiguration configuration)
    {
      var authenticationOptions = AuthenticationOptions(configuration);

      var tokenUri = authenticationOptions.AuthServerUrl
          .AppendPathSegment("realms")
          .AppendPathSegment(authenticationOptions.Realm)
          .AppendPathSegment("protocol")
          .AppendPathSegment("openid-connect")
          .AppendPathSegment("token").ToUri();

      var authUri = authenticationOptions.AuthServerUrl
          .AppendPathSegment("realms")
          .AppendPathSegment(authenticationOptions.Realm)
          .AppendPathSegment("protocol")
          .AppendPathSegment("openid-connect")
          .AppendPathSegment("auth").ToUri();

      return new KeycloakAuthOptions
      {
        ClientId = authenticationOptions.Resource,
        ClientSecret = authenticationOptions.Credentials.Secret,
        AuthorizationUrl = authUri,
        TokenUrl = tokenUri
      };
    }
    #endregion

    #region Private Members
    private static KeycloakAuthenticationOptions AuthenticationOptions(IConfiguration configuration)
    {
      var authenticationOptions = configuration.GetSection(KeycloakAuthenticationOptions.Section).Get<KeycloakAuthenticationOptions>();

      return authenticationOptions ?? throw new InvalidOperationException($"Failed to retrieve configuration section '{KeycloakAuthenticationOptions.Section}'");
    }

    private static KeycloakProtectionClientOptions ProtectionClientOptions(IConfiguration configuration)
    {
      var protectionClientOptions = configuration
        .GetSection(KeycloakProtectionClientOptions.Section).Get<KeycloakProtectionClientOptions>()
        ?? throw new InvalidOperationException($"Failed to retrieve config section '{KeycloakProtectionClientOptions.Section}.{nameof(KeycloakProtectionClientOptions)}'");
      return protectionClientOptions;
    }
    #endregion
  }
}
