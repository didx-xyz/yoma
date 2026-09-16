using Yoma.Core.Domain.Payout;

namespace Yoma.Core.Infrastructure.IXO.YellowCard.Helpers
{
  internal static class YellowCardStatusHelper
  {
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
  }
}
