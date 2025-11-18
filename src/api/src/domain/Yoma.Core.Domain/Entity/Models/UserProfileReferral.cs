using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Entity.Models
{
  public class UserProfileReferral
  {
    /// <summary>
    /// True if the user is blocked from participating in referrals.
    /// </summary>
    public bool Blocked { get; set; }

    public DateTimeOffset? BlockedDate { get; set; }

    public List<ReferralLinkUsageItem>? LinkUsages { get; set; }
  }
}
