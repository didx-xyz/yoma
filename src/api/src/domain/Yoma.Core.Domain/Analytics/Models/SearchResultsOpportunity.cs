namespace Yoma.Core.Domain.Analytics.Models
{
  public class SearchResultsOpportunity
  {
    public List<OpportunityInfoAnalytics> Items { get; set; } = null!;

    public int TotalCount { get; set; }

    public DateTimeOffset DateStamp { get; set; }
  }
}
