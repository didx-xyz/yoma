namespace Yoma.Core.Domain.LaborMarketProvider.Interfaces
{
  public interface ILaborMarketProviderClientFactory
  {
    ILaborMarketProviderClient CreateClient();
  }
}
