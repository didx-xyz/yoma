using Yoma.Core.Domain.Payout.Interfaces.Provider;
using Yoma.Core.Domain.Payout.Models.Provider;
using Yoma.Core.Infrastructure.YellowCard.Models;

namespace Yoma.Core.Infrastructure.YellowCard.Client
{
  public sealed class YellowCardClient : IPayoutProviderClient
  {
    #region Constructor
    public YellowCardClient(YellowCardOptions options)
    {
      ArgumentNullException.ThrowIfNull(options, nameof(options));
    }
    #endregion

    #region Public Members
    public Task<PayoutResponse> InitiateAsync(PayoutRequest request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      // TODO: Confirm the base URL, authentication scheme, payout-initiation endpoint and request method.
      // TODO: Confirm idempotency/reference fields, hosted-flow response, token/link expiry and error contract.
      throw new NotImplementedException("Yellow Card cash-out integration has not been implemented");
    }
    #endregion
  }
}
