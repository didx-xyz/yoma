namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunityRequestVerifyFinalizeBatch
  {
    public VerificationStatus Status { get; set; }

    public string Comment { get; set; }

    public List<MyOpportunityRequestVerifyFinalizeBatchItem> Items { get; set; }
  }

  public class MyOpportunityRequestVerifyFinalizeBatchItem
  {
    public Guid OpportunityId { get; set; }

    public Guid UserId { get; set; }
  }
}
