using Yoma.Core.Domain.Payout.Interfaces.Provider;
using Yoma.Core.Domain.Payout.Models.Provider;
using Yoma.Core.Infrastructure.IXO.YellowCard.Models;

namespace Yoma.Core.Infrastructure.IXO.YellowCard.Client
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
    public Task<PayoutResponse> Initiate(PayoutRequest request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      // TODO: Confirm the base URL, authentication scheme, payout-initiation endpoint and request method.
      // TODO: Confirm idempotency/reference fields, hosted-flow response, token/link expiry and error contract.
      throw new NotImplementedException("Yellow Card payout integration has not been implemented");
    }

    public Task<PayoutSessionResponse> GetSession(PayoutSessionRequest request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      if (request.Id == Guid.Empty)
        throw new ArgumentNullException(nameof(request), "Payout transaction id is empty");

      var transactionId = request.TransactionId?.Trim();
      if (string.IsNullOrEmpty(transactionId))
        throw new ArgumentNullException(nameof(request), "Provider transaction id is empty");
      request.TransactionId = transactionId;

      // TODO: Confirm the IXO / Yellow Card endpoint used to create a new hosted session for an active payout.
      // TODO: Confirm whether lookup uses the Yoma external reference, provider transaction id or both.
      throw new NotImplementedException("Yellow Card hosted payout session retrieval has not been implemented");
    }

    public Task<PayoutStatusResponse> GetStatus(PayoutStatusRequest request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      if (request.Id == Guid.Empty)
        throw new ArgumentNullException(nameof(request), "Payout transaction id is empty");

      request.TransactionId = request.TransactionId?.Trim();

      // TODO: Confirm whether IXO / Yellow Card supports lookup by Yoma reference / idempotency key and provider transaction id.
      // TODO: Confirm the provider status mapping and not-found behaviour required by automatic reconciliation.
      // The normalized response must identify Provider.YellowCard.
      throw new NotImplementedException("Yellow Card payout transaction lookup has not been implemented");
    }
    #endregion
  }
}
