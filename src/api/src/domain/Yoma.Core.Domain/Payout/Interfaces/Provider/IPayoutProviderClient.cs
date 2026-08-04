using Yoma.Core.Domain.Payout.Models.Provider;

namespace Yoma.Core.Domain.Payout.Interfaces.Provider
{
  public interface IPayoutProviderClient
  {
    Task<PayoutResponse> Initiate(PayoutRequest request);

    Task<PayoutStatusResponse> GetStatus(PayoutStatusRequest request);
  }
}
