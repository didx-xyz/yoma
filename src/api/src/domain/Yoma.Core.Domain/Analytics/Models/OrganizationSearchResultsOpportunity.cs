namespace Yoma.Core.Domain.Analytics.Models
{
  public class OrganizationSearchResultsOpportunity
  {
    public List<OpportunityInfoAnalytics> Items { get; set; }

    public int TotalCount { get; set; }

    public DateTimeOffset DateStamp { get; set; }
  }
}
