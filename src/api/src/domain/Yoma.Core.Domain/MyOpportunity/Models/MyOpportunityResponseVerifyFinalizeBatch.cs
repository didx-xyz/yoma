using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunityResponseVerifyFinalizeBatch
  {
    public VerificationStatus Status { get; set; }

    public List<MyOpportunityResponseVerifyFinalizeBatchItem> Items { get; set; } = null!;
  }

  public class MyOpportunityResponseVerifyFinalizeBatchItem
  {
    public Guid OpportunityId { get; set; }

    public string OpportunityTitle { get; set; } = null!;

    public Guid UserId { get; set; }

    public string UserDisplayName { get; set; } = null!;

    public bool Success => Failure == null;

    public ErrorResponseItem? Failure { get; set; }
  }
}
