namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunityRequestVerifyFinalize
  {
    public Guid OpportunityId { get; set; }

    public Guid UserId { get; set; }

    public VerificationStatus Status { get; set; }

    public string Comment { get; set; }
  }
}
