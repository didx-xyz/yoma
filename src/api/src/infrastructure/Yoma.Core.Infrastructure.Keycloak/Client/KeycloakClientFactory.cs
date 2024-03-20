using Keycloak.AuthServices.Authentication;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Infrastructure.Keycloak.Models;

namespace Yoma.Core.Infrastructure.Keycloak.Client
{
  public class KeycloakClientFactory : IIdentityProviderClientFactory
  {
    #region Class Variables
    private readonly KeycloakAdminOptions _keycloakAdminOptions;
    private readonly KeycloakAuthenticationOptions _keycloakAuthenticationOptions;
    #endregion

    #region Constructor
    public KeycloakClientFactory(IOptions<KeycloakAdminOptions> keycloakAdminOptions,
        IOptions<KeycloakAuthenticationOptions> keycloakAuthenticationOptions)
    {
      _keycloakAdminOptions = keycloakAdminOptions.Value;
      _keycloakAuthenticationOptions = keycloakAuthenticationOptions.Value;
    }
    #endregion

    #region Public Members
    public IIdentityProviderClient CreateClient()
    {
      return new KeycloakClient(_keycloakAdminOptions, _keycloakAuthenticationOptions);
    }
    #endregion
  }
}
