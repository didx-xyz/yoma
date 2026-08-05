using Yoma.Core.Domain.Payout;

namespace Yoma.Core.Domain.Entity.Models
{
  public sealed class UserProfilePayout
  {
    public bool Active => Amount.HasValue;

    public decimal? Amount { get; set; }

    public Currency? Currency { get; set; }
  }
}
