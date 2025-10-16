namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunityRequestVerifyFinalizeBatch
  {
    public VerificationStatus Status { get; set; }

    public string Comment { get; set; } = null!;

    public List<MyOpportunityRequestVerifyFinalizeBatchItem> Items { get; set; } = null!;
  }

  public class MyOpportunityRequestVerifyFinalizeBatchItem
  {
    public Guid OpportunityId { get; set; }

    public Guid UserId { get; set; }
  }
}
