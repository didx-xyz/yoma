using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunityResponseVerifyStatus
  {
    public VerificationStatus Status { get; set; }

    public decimal? PercentComplete { get; set; }

    public string? Comment { get; set; }

    public DateTimeOffset? DateCompleted { get; set; }

    public SyncInfoMyOpportunity? SyncedInfo { get; set; }
  }
}
