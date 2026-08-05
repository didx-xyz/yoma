using Yoma.Core.Domain.Payout.Models;
using Yoma.Core.Domain.Payout.Models.Provider;

namespace Yoma.Core.Domain.Payout.Extensions
{
  public static class PayoutExtensions
  {
    public static PayoutSession ToPayoutSession(this PayoutResponse value, PayoutTransaction payout)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));
      return ToPayoutSession(payout, value.PaymentUrl, value.ExpiresAt);
    }

    public static PayoutSession ToPayoutSession(this PayoutSessionResponse value, PayoutTransaction payout)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));
      return ToPayoutSession(payout, value.PaymentUrl, value.ExpiresAt);
    }

    private static PayoutSession ToPayoutSession(PayoutTransaction payout, string paymentUrl, DateTimeOffset expiresAt)
    {
      ArgumentNullException.ThrowIfNull(payout, nameof(payout));

      var paymentUrlNormalized = paymentUrl?.Trim();
      if (string.IsNullOrEmpty(paymentUrlNormalized))
        throw new ArgumentNullException(nameof(paymentUrl));

      if (expiresAt <= DateTimeOffset.UtcNow)
        throw new InvalidOperationException("The payout provider session has already expired");

      if (payout.RewardReservationExpiresAt.HasValue && expiresAt >= payout.RewardReservationExpiresAt.Value)
        throw new InvalidOperationException("The payout provider session must expire before the reward reservation");

      return new PayoutSession
      {
        Amount = payout.Amount,
        PaymentUrl = paymentUrlNormalized,
        ExpiresAt = expiresAt
      };
    }
  }
}
