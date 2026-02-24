namespace Yoma.Core.Domain.Analytics.Models
{
  public class SearchResultsEngagement
  {
    public EngagementOpportunity Opportunities { get; set; } = null!;

    public EngagementOpportunitySkill Skills { get; set; } = null!;

    public EngagementDemographic Demographics { get; set; } = null!;

    public EngagementCumulative Cumulative { get; set; } = null!;

    public DateTimeOffset DateStamp { get; set; }
  }
}
