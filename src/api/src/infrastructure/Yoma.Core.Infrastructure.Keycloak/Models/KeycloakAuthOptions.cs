using Yoma.Core.Domain.IdentityProvider.Interfaces;

namespace Yoma.Core.Infrastructure.Keycloak.Models
{
  public class KeycloakAuthOptions : IIdentityProviderAuthOptions
  {
    public string ClientId { get; set; } = null!;

    public string ClientSecret { get; set; } = null!;

    public Uri AuthorizationUrl { get; set; } = null!;

    public Uri TokenUrl { get; set; } = null!;
  }
}
