using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunityResponseVerifyFinalizeBatch
  {
    public List<MyOpportunityResponseVerifyFinalizeBatchItem> Items { get; set; }
  }

  public class MyOpportunityResponseVerifyFinalizeBatchItem
  {
    public Guid OpportunityId { get; set; }

    public string OpportunityTitle { get; set; }

    public Guid UserId { get; set; }

    public string? UserDisplayName { get; set; }

    public bool Success => Failure == null;

    public ErrorResponseItem? Failure { get; set; }
  }
}
