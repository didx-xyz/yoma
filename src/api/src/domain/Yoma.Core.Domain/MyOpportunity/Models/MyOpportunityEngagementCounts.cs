namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunityEngagementCounts
  {
    public Guid OpportunityId { get; set; }

    public int CountViewed { get; set; }

    public int CountNavigatedExternalLink { get; set; }

    public int ParticipantCountPending { get; set; }
  }
}
