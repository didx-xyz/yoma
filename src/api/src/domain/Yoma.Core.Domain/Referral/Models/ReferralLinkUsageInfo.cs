namespace Yoma.Core.Domain.Referral.Models
{
  public class ReferralLinkUsageInfo
  {
    public Guid Id { get; set; }

    public Guid ProgramId { get; set; }

    public string ProgramName { get; set; }

    public Guid LinkId { get; set; }

    public string LinkName { get; set; }

    public Guid UserId { get; set; }

    public string UserDisplayName { get; set; }

    public string? UserEmail { get; set; }

    public string? UserPhoneNumer { get; set; }

    public Guid StatusId { get; set; }

    public ReferralLinkUsageStatus Status { get; set; }

    public DateTimeOffset DateClaimed { get; set; } 

    public DateTimeOffset? DateCompleted { get; set; }

    public DateTimeOffset? DateExpired { get; set; }

    public bool? ProofOfPersonhoodCompleted { get; set; }

    public ProofOfPersonhoodMethod? ProofOfPersonhoodMethod { get; set; }

    public bool? PathwaysCompleted { get; set; }

    public decimal? PercentComplete { get; set; }

    public ProgramPathwayProgress? Pathway { get; set; }
  }
}
