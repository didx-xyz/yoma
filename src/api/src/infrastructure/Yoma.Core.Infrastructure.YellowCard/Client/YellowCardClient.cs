using Yoma.Core.Domain.Reward.Interfaces.Provider;
using Yoma.Core.Domain.Reward.Models.Provider;
using Yoma.Core.Infrastructure.YellowCard.Models;

namespace Yoma.Core.Infrastructure.YellowCard.Client
{
  public sealed class YellowCardClient : IRewardCashOutProviderClient
  {
    #region Constructor
    public YellowCardClient(YellowCardOptions options)
    {
      ArgumentNullException.ThrowIfNull(options, nameof(options));
    }
    #endregion

    #region Public Members
    public Task<RewardCashOutResponse> CashOutAsync(RewardCashOutRequest request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      // TODO: Confirm the base URL, authentication scheme, payout-initiation endpoint and request method.
      // TODO: Confirm idempotency/reference fields, hosted-flow response, token/link expiry and error contract.
      throw new NotImplementedException("Yellow Card cash-out integration has not been implemented");
    }
    #endregion
  }
}
