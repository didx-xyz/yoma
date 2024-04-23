namespace Yoma.Core.Domain.Opportunity.Models
{
  public abstract class OpportunityRequestBase
  {
    public string Title { get; set; }

    public string Description { get; set; }

    public Guid TypeId { get; set; }

    public Guid OrganizationId { get; set; }

    public string? Summary { get; set; }

    public string? Instructions { get; set; }

    public string? URL { get; set; }

    public decimal? ZltoReward { get; set; }

    public decimal? YomaReward { get; set; }

    public decimal? ZltoRewardPool { get; set; }

    public decimal? YomaRewardPool { get; set; }

    public bool VerificationEnabled { get; set; }

    public VerificationMethod? VerificationMethod { get; set; }

    public Guid DifficultyId { get; set; }

    public Guid CommitmentIntervalId { get; set; }

    public short CommitmentIntervalCount { get; set; }

    public int? ParticipantLimit { get; set; }

    public List<string>? Keywords { get; set; }

    public DateTimeOffset DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public bool CredentialIssuanceEnabled { get; set; }

    public string? SSISchemaName { get; set; }

    public List<Guid> Categories { get; set; }

    public List<Guid> Countries { get; set; }

    public List<Guid> Languages { get; set; }

    public List<Guid> Skills { get; set; }

    public List<OpportunityRequestVerificationType>? VerificationTypes { get; set; }
  }
}
