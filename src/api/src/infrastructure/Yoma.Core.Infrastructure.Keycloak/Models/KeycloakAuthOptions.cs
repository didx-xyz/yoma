using Yoma.Core.Domain.IdentityProvider.Interfaces;

namespace Yoma.Core.Infrastructure.Keycloak.Models
{
  public class KeycloakAuthOptions : IIdentityProviderAuthOptions
  {
    public string ClientId { get; set; }

    public string ClientSecret { get; set; }

    public Uri AuthorizationUrl { get; set; }

    public Uri TokenUrl { get; set; }
  }
}
