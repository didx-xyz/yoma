using Yoma.Core.Domain.Payout.Models;

namespace Yoma.Core.Domain.Entity.Models
{
  public sealed class UserProfilePayout
  {
    public bool Pending { get; set; }

    public PayoutInfo? Info { get; set; }
  }
}
