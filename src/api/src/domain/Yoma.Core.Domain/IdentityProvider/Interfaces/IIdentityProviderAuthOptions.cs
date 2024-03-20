namespace Yoma.Core.Domain.IdentityProvider.Interfaces
{
  public interface IIdentityProviderAuthOptions
  {
    string ClientId { get; }

    string ClientSecret { get; }

    Uri AuthorizationUrl { get; }

    Uri TokenUrl { get; }
  }
}
