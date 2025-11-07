using Yoma.Core.Domain.Referral.Models.Lookups;

namespace Yoma.Core.Domain.Entity.Models
{
  public class UserProfileReferral
  {
    /// <summary>
    /// True if the user is blocked from participating in referrals.
    /// </summary>
    public bool Blocked { get; set; }

    public DateTimeOffset? BlockedDate { get; set; }

    public List<UserProfileReferralLinkUsage>? LinkUsages { get; set; }
  }

  public class UserProfileReferralLinkUsage
  {
    public Guid Id { get; set; }

    public Referral.ReferralLinkUsageStatus Status { get; set; }

    public Guid ProgramId { get; set; }

    public string ProgramName { get; set; } = null!;
  }
}
