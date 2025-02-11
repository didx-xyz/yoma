namespace Yoma.Core.Domain.Analytics.Models
{
  public class OrganizationSearchResultsEngagement
  {
    public OrganizationOpportunity Opportunities { get; set; }

    public OrganizationOpportunitySkill Skills { get; set; }

    public OrganizationDemographic Demographics { get; set; }

    public OrganizationCumulative Cumulative { get; set; }

    public DateTimeOffset DateStamp { get; set; }
  }
}
