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

    public string ProgramName { get; set; } = null!;

    public Guid LinkId { get; set; }

    public string LinkName { get; set; } = null!;

    #region Referrer Info (mapped to the link)
    public Guid UserIdReferrer { get; set; }

    public string? UserDisplayNameReferrer { get; set; } = null!;

    public string? UserEmailReferrer { get; set; }

    public string? UserPhoneNumberReferrer { get; set; }
    #endregion

    #region Referee Info (mapped to the usage)
    public Guid UserId { get; set; }

    public string? UserDisplayName { get; set; } = null!;

    public string? UserEmail { get; set; }

    public string? UserPhoneNumber { get; set; }

    public bool? UserPhoneNumberConfirmed { get; set; }
    #endregion

    public Guid StatusId { get; set; }

    public ReferralLinkUsageStatus Status { get; set; }

    public DateTimeOffset DateClaimed { get; set; }

    public DateTimeOffset? DateCompleted => Status == ReferralLinkUsageStatus.Completed ? DateModified : null;

    public DateTimeOffset? DateExpired => Status == ReferralLinkUsageStatus.Expired ? DateModified : null;

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
