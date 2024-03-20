namespace Yoma.Core.Domain.Marketplace.Interfaces.Provider
{
  public interface IMarketplaceProviderClientFactory
  {
    IMarketplaceProviderClient CreateClient();
  }
}
