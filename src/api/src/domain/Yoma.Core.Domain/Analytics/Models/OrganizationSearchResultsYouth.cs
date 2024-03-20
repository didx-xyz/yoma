namespace Yoma.Core.Domain.Analytics.Models
{
  public class OrganizationSearchResultsYouth
  {
    public List<YouthInfo> Items { get; set; }

    public int TotalCount { get; set; }

    public DateTimeOffset DateStamp { get; set; }

  }
}
