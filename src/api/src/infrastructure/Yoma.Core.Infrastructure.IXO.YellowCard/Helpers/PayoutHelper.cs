using System.Globalization;
using Yoma.Core.Domain.Payout;
using Yoma.Core.Domain.Payout.Models.Provider;
using Yoma.Core.Infrastructure.IXO.YellowCard.Models;

namespace Yoma.Core.Infrastructure.IXO.YellowCard.Helpers
{
  internal static class PayoutHelper
  {
    internal static Domain.Payout.Models.PayoutCountry ToPayoutCountry(
      Domain.Lookups.Models.Country country, YellowCardCountryLimits? limits)
    {
      var minimum = limits?.LowestMinUsd;
      if (minimum < 0)
        throw new Domain.Core.Exceptions.DataInconsistencyException("IXO returned a negative country payout minimum");

      return new Domain.Payout.Models.PayoutCountry
      {
        Id = country.Id,
        Name = country.Name,
        CodeAlpha2 = country.CodeAlpha2,
        CodeAlpha3 = country.CodeAlpha3,
        CodeNumeric = country.CodeNumeric,
        // lowestMinUsd already includes IXO's exchange-rate buffer. Zero means no minimum.
        // The provider's currency field labels local channel amounts, not this USD value.
        MinimumAmount = minimum == 0 ? null : minimum,
        Currency = Currency.USD
      };
    }

    internal static PayoutTransactionStatus ToPayoutStatus(string? status)
    {
      status = status?.Trim();
      if (string.IsNullOrEmpty(status))
        throw new ArgumentNullException(nameof(status));

      return status.ToLowerInvariant() switch
      {
        "initiated" or "processing" => PayoutTransactionStatus.Processing,
        "completed" => PayoutTransactionStatus.Completed,
        "failed" => PayoutTransactionStatus.Failed,
        "cancelled" => PayoutTransactionStatus.Cancelled,
        "expired" => PayoutTransactionStatus.Expired,
        _ => throw new ArgumentOutOfRangeException(nameof(status), $"IXO payout status '{status}' is not supported")
      };
    }

    internal static PayoutResponse ToPayoutResponse(YellowCardPayoutSessionResponse response)
    {
      ArgumentNullException.ThrowIfNull(response);
      ValidateSessionStatus(response.Status);

      var transactionId = response.ProviderTransactionId?.Trim();
      if (string.IsNullOrEmpty(transactionId))
        throw new ArgumentNullException(nameof(response), "Provider transaction id is empty");

      var session = MapSession(response);
      return new PayoutResponse
      {
        TransactionId = transactionId,
        CanCancel = session.CanCancel,
        PaymentUrl = session.PaymentUrl,
        ExpiresAt = session.ExpiresAt
      };
    }

    internal static PayoutSessionResponse ToPayoutSessionResponse(YellowCardPayoutSessionResponse response)
    {
      ArgumentNullException.ThrowIfNull(response);
      ValidateSessionStatus(response.Status);
      return MapSession(response);
    }

    private static PayoutSessionResponse MapSession(YellowCardPayoutSessionResponse response)
    {
      return new PayoutSessionResponse
      {
        CanCancel = CanCancel(response.Status),
        PaymentUrl = NormalizePaymentUrl(response.PaymentUrl),
        ExpiresAt = ParseDateTimeOffset(response.ExpiresAt, nameof(response.ExpiresAt))
      };
    }

    internal static bool CanCancel(string status)
    {
      // Validate before advertising eligibility; unknown provider states are not a confirmed false.
      ToPayoutStatus(status);
      return string.Equals(status.Trim(), "initiated", StringComparison.OrdinalIgnoreCase);
    }

    private static void ValidateSessionStatus(string status)
    {
      if (ToPayoutStatus(status) != PayoutTransactionStatus.Processing)
        throw new InvalidOperationException($"IXO hosted payout session cannot be returned for status '{status}'");
    }

    private static string NormalizePaymentUrl(string? paymentUrl)
    {
      paymentUrl = paymentUrl?.Trim();
      if (string.IsNullOrEmpty(paymentUrl))
        throw new ArgumentNullException(nameof(paymentUrl));
      if (!Uri.TryCreate(paymentUrl, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps)
        throw new InvalidOperationException("IXO hosted payout response must contain a valid HTTPS payment URL");

      return paymentUrl;
    }

    private static DateTimeOffset ParseDateTimeOffset(string? value, string propertyName)
    {
      if (!DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var result))
        throw new InvalidOperationException($"IXO hosted payout response contains an invalid '{propertyName}' value");

      return result;
    }
  }
}
