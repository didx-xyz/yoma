using Yoma.Core.Domain.Referral;

namespace Yoma.Core.Domain.Entity.Models
{
  public class UserProfileReferral
  {
    /// <summary>
    /// True if the user is blocked from participating in referrals.
    /// </summary>
    public bool Blocked { get; set; }

    public DateTimeOffset? BlockedDate { get; set; }

    public List<ReferralParticipationRole>? Roles { get; set; }
  }
}
