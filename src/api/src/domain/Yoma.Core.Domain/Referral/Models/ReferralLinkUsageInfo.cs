namespace Yoma.Core.Domain.Referral.Models
{
  public class ReferralLinkUsageInfo
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
    #endregion

    public Guid StatusId { get; set; }

    public ReferralLinkUsageStatus Status { get; set; }

    public DateTimeOffset DateClaimed { get; set; } 

    public DateTimeOffset? DateCompleted { get; set; }

    public DateTimeOffset? DateExpired { get; set; }

    public bool? ProofOfPersonhoodCompleted { get; set; }

    public ProofOfPersonhoodMethod? ProofOfPersonhoodMethod { get; set; }

    public bool? PathwayCompleted { get; set; }

    public decimal? PercentComplete { get; set; }

    public ProgramPathwayProgress? Pathway { get; set; }
  }
}
