namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public sealed class MyOpportunityRequestVerifyImportPartnerSync
  {
    public Guid OpportunityId { get; set; }

    public Guid UserId { get; set; }

    public DateTimeOffset? DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public MyOpportunityRequestVerifyCommitmentInterval? CommitmentInterval { get; set; }

    public bool Completed { get; set; }

    public decimal? PercentComplete { get; set; }

    public DateTimeOffset? DateCompleted { get; set; }
  }
}
