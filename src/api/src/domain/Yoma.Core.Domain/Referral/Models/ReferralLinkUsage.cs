
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;

namespace Yoma.Core.Domain.Referral.Models
{
  /// <summary>
  /// Represents a referee's engagement created when a referral link is claimed.
  /// Each engagement is uniquely tied to the referral link and the associated program.
  /// Only one engagement is allowed per referee per program.
  /// Tracks the referee user's progress and current claim status.
  ///
  /// Redaction:
  /// - Not required. This model is only ever returned to:
  ///   • The referee (for their own usage),
  ///   • The referrer (for usages on their own links), or
  ///   • Admin users.
  /// No anonymous or system-wide exposure.
  /// </summary>
  public class ReferralLinkUsage
  {
    public Guid Id { get; set; }

    public Guid ProgramId { get; set; }

    public string ProgramName { get; set; } = null!;

    public string? ProgramDescription { get; set; }

    public int? ProgramCompletionWindowInDays { get; set; }

    public DateTimeOffset? ProgramDateEnd { get; set; }

    public int? TimeRemainingInDays
    {
      get
      {
        if (!ProgramCompletionWindowInDays.HasValue && !ProgramDateEnd.HasValue) return null;

        var windowDateEnd = ProgramCompletionWindowInDays.HasValue ? DateClaimed.AddDays(ProgramCompletionWindowInDays.Value) : (DateTimeOffset?)null;
        var effectiveDateEnd = DateTimeHelper.Min(windowDateEnd, ProgramDateEnd)!;

        var remaining = effectiveDateEnd.Value - DateTimeOffset.UtcNow;
        return remaining <= TimeSpan.Zero ? 0 : (int)Math.Ceiling(remaining.TotalDays);
      }
    }

    public DateTimeOffset? DateCompleteBy => TimeRemainingInDays.HasValue ? DateClaimed.AddDays(TimeRemainingInDays.Value).ToEndOfDay() : null;

    public Guid LinkId { get; set; }

    public string LinkName { get; set; } = null!;

    #region Referrer Info (mapped to the link)
    public Guid UserIdReferrer { get; set; }

    public string UsernameReferrer { get; set; } = null!;

    public string UserDisplayNameReferrer { get; set; } = null!;

    public string? UserEmailReferrer { get; set; }

    public bool? UserEmailConfirmedReferrer { get; set; }

    public string? UserPhoneNumberReferrer { get; set; }

    public bool? UserPhoneNumberConfirmedReferrer { get; set; }
    #endregion

    #region Referee Info (mapped to the usage)
    public Guid UserId { get; set; }

    public string Username { get; set; } = null!;

    public string UserDisplayName { get; set; } = null!;

    public string? UserEmail { get; set; }

    public bool? UserEmailConfirmed { get; set; }

    public string? UserPhoneNumber { get; set; }

    public bool? UserPhoneNumberConfirmed { get; set; }

    public bool? UserYoIDOnboarded { get; set; }
    #endregion

    public Guid StatusId { get; set; }

    public ReferralLinkUsageStatus Status { get; set; }

    /// <summary>Actual ZLTO amount paid to the referee for this usage after all eligibility and payout rules.</summary>
    public decimal? ZltoRewardReferee { get; set; }

    /// <summary>Actual ZLTO amount paid to the referrer for this usage after all eligibility and payout rules.</summary>
    public decimal? ZltoRewardReferrer { get; set; }

    public DateTimeOffset DateClaimed { get; set; }

    public DateTimeOffset? DateCompleted => Status == ReferralLinkUsageStatus.Completed ? DateModified : null;

    public DateTimeOffset? DateExpired => Status == ReferralLinkUsageStatus.Expired ? DateModified : null;

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
