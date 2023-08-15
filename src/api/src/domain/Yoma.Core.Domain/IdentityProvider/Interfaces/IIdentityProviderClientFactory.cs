namespace Yoma.Core.Domain.IdentityProvider.Interfaces
{
  public interface IIdentityProviderClientFactory
  {
    IIdentityProviderClient CreateClient();
  }
}
