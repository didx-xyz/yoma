namespace Yoma.Core.Domain.Payout.Interfaces.Provider
{
  public interface IPayoutProviderClientFactory
  {
    IPayoutProviderClient CreateClient();
  }
}