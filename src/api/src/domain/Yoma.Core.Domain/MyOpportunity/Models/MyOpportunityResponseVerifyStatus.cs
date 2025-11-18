namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunityResponseVerifyStatus
  {
    public VerificationStatus Status { get; set; }

    public string? Comment { get; set; }

    public DateTimeOffset? DateCompleted { get; set; }
  }
}
