namespace Yoma.Core.Domain.Referral.Models
{
  public class ReferralLinkUsageInfo
  {
    public Guid Id { get; set; }

    public Guid ProgramId { get; set; }

    public string ProgramName { get; set; } = null!;

    public int? ProgramCompletionWindowInDays { get; set; }

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
    #endregion

    public Guid StatusId { get; set; }

    public ReferralLinkUsageStatus Status { get; set; }

    public decimal? ZltoRewardReferrer { get; set; }

    public decimal? ZltoRewardReferee { get; set; }

    public decimal? ZltoRewardTotal => (ZltoRewardReferrer ?? 0) + (ZltoRewardReferee ?? 0);

    public DateTimeOffset DateClaimed { get; set; }

    public DateTimeOffset? DateCompleted { get; set; }

    public DateTimeOffset? DateExpired { get; set; }

    public bool? ProofOfPersonhoodCompleted { get; set; }

    public ProofOfPersonhoodMethod? ProofOfPersonhoodMethod { get; set; }

    public bool? PathwayCompleted => Pathway?.Completed;

    public decimal? PercentComplete { get; set; }

    public ProgramPathwayProgress? Pathway { get; set; }
  }
}
