using Keycloak.AuthServices.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Infrastructure.Keycloak.Models;

namespace Yoma.Core.Infrastructure.Keycloak.Client
{
  public class KeycloakClientFactory : IIdentityProviderClientFactory
  {
    #region Class Variables
    private readonly ILogger<KeycloakClient> _logger;
    private readonly AppSettings _appSettings;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly KeycloakAdminOptions _keycloakAdminOptions;
    private readonly KeycloakAuthenticationOptions _keycloakAuthenticationOptions;
    #endregion

    #region Constructor
    public KeycloakClientFactory(ILogger<KeycloakClient> logger,
      IOptions<AppSettings> appSettings,
      IEnvironmentProvider environmentProvider,
      IOptions<KeycloakAdminOptions> keycloakAdminOptions,
      IOptions<KeycloakAuthenticationOptions> keycloakAuthenticationOptions)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _environmentProvider = environmentProvider;
      _keycloakAdminOptions = keycloakAdminOptions.Value;
      _keycloakAuthenticationOptions = keycloakAuthenticationOptions.Value;
    }
    #endregion

    #region Public Members
    public IIdentityProviderClient CreateClient()
    {
      return new KeycloakClient(_logger, _appSettings, _environmentProvider, _keycloakAdminOptions, _keycloakAuthenticationOptions);
    }
    #endregion
  }
}
