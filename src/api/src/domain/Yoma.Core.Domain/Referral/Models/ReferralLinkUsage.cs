namespace Yoma.Core.Domain.Referral.Models
{
  /// <summary>
  /// Represents a referee's engagement created when a referral link is claimed.
  /// Each engagement is uniquely tied to the referral link and the associated program.
  /// Only one engagement is allowed per referee per program.
  /// Tracks the referee user's progress and current claim status.
  /// </summary>
  public class ReferralLinkUsage
  {
    public Guid Id { get; set; }

    public Guid ProgramId { get; set; }

    public Guid LinkId { get; set; }

    public Guid UserId { get; set; }

    public Guid StatusId { get; set; }

    public ReferralLinkUsageStatus Status { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
