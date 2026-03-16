using Flurl;
using Flurl.Http;
using Microsoft.AspNetCore.WebUtilities;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Reward.Interfaces.Provider;
using Yoma.Core.Domain.Reward.Models.Provider;
using Yoma.Core.Infrastructure.Chimoney.Extensions;
using Yoma.Core.Infrastructure.Chimoney.Models;

namespace Yoma.Core.Infrastructure.Chimoney.Client
{
  public sealed class ChimoneyClient : IRewardCashOutProviderClient
  {
    #region Class Variables
    private readonly ChimoneyOptions _options;
    #endregion

    #region Constructor
    public ChimoneyClient(ChimoneyOptions options)
    {
      _options = options ?? throw new ArgumentNullException(nameof(options));
    }
    #endregion

    #region Public Members
    public async Task<RewardCashOutResponse> CashOutAsync(RewardCashOutRequest request)
    {
      ArgumentNullException.ThrowIfNull(request);

      if (request.TransactionId == Guid.Empty)
        throw new ArgumentException("Transaction Id is required", nameof(request));

      request.Email = request.Email?.Trim();
      request.PhoneNumber = request.PhoneNumber?.Trim();

      if (string.IsNullOrWhiteSpace(request.Email) &&
          string.IsNullOrWhiteSpace(request.PhoneNumber))
        throw new ArgumentException("Either email or phone or both are required", nameof(request));

      if (request.AmountInUSD <= 0)
        throw new ArgumentOutOfRangeException(nameof(request), "Amount must be greater than zero");

      var payoutRequest = new PayoutRequest
      {
        TurnOffNotification = false,
        Chimoneys =
        [
          new PayoutRequestItem
      {
        Email = request.Email,
        Phone = request.PhoneNumber,
        ValueInUSD = request.AmountInUSD,
        CollectionPaymentIssueID = request.TransactionId.ToString()
      }
        ]
      };

      var payoutResponse = await _options.BaseUrl
        .AppendPathSegment("payouts/chimoney")
        .WithAuthHeader(GetAuthHeaderApiKey())
        .PostJsonAsync(payoutRequest)
        .EnsureSuccessStatusCodeChimoneyAsync()
        .ReceiveJson<PayoutResponse>();

      if (payoutResponse?.Data == null)
        throw new DataInconsistencyException("Response data expected but is null");

      var issueId = payoutResponse.Data.Chimoneys?.FirstOrDefault()?.IssueID;

      // fallback
      if (string.IsNullOrWhiteSpace(issueId) && !string.IsNullOrWhiteSpace(payoutResponse.Data.PaymentLink))
      {
        if (Uri.TryCreate(payoutResponse.Data.PaymentLink, UriKind.RelativeOrAbsolute, out var uri))
        {
          var query = QueryHelpers.ParseQuery(uri.Query);
          if (query.TryGetValue("issueID", out var value))
          {
            issueId = value.FirstOrDefault();
          }
        }
      }

      if (string.IsNullOrWhiteSpace(issueId))
        throw new DataInconsistencyException("Response issue id expected but is missing");

      return new RewardCashOutResponse
      {
        TransactionReference = issueId,
        PaymentLink = payoutResponse.Data.PaymentLink
      };
    }
    #endregion

    #region Private Members
    private KeyValuePair<string, string> GetAuthHeaderApiKey()
    {
      return new KeyValuePair<string, string>(_options.ApiKeyHeaderName, _options.ApiKey);
    }
    #endregion
  }
}
