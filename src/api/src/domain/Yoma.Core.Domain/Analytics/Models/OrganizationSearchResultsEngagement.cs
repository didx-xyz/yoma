namespace Yoma.Core.Domain.Analytics.Models
{
  public class OrganizationSearchResultsEngagement
  {
    public OrganizationOpportunity Opportunities { get; set; } = null!;

    public OrganizationOpportunitySkill Skills { get; set; } = null!;

    public OrganizationDemographic Demographics { get; set; } = null!;

    public OrganizationCumulative Cumulative { get; set; } = null!;

    public DateTimeOffset DateStamp { get; set; }
  }
}
