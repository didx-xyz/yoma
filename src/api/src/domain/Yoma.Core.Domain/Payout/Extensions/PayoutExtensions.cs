using Yoma.Core.Domain.Payout.Models;

namespace Yoma.Core.Domain.Payout.Extensions
{
  public static class PayoutExtensions
  {
    public static PayoutInfo ToPayoutInfo(this PayoutTransaction value)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      return new PayoutInfo
      {
        Amount = value.Amount,
        PaymentUrl = value.PaymentUrl
      };
    }
  }
}
