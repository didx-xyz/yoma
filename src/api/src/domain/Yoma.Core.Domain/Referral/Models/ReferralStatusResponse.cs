namespace Yoma.Core.Domain.Referral.Models
{
  public class ReferralStatusResponse
  {
    /// <summary>
    /// Indicates whether referrals are currently available to the user
    /// (true if there are active programs).
    /// </summary>
    public bool Available { get; set; }

    /// <summary>
    /// True if the user is blocked from participating in referrals.
    /// </summary>
    public bool Blocked { get; set; }

    /// <summary>
    /// Optional reason why the user is blocked.
    /// </summary>
    public string? BlockReason { get; set; }

    /// <summary>
    /// Metadata for the default referral program (always present).
    /// </summary>
    public Guid DefaultProgramId { get; set; }

    public string DefaultProgramName { get; set; } = null!;

    public string? DefaultProgramImageUrl { get; set; }
  }
}
