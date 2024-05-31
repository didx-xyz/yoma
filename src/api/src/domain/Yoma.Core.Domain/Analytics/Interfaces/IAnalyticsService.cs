using Yoma.Core.Domain.Analytics.Models;

namespace Yoma.Core.Domain.Analytics.Interfaces
{
  public interface IAnalyticsService
  {
    List<Lookups.Models.Country> ListSearchCriteriaCountriesEngaged(Guid organizationId);

    OrganizationSearchResultsEngagement SearchOrganizationEngagement(OrganizationSearchFilterEngagement filter);

    OrganizationSearchResultsOpportunity SearchOrganizationOpportunities(OrganizationSearchFilterOpportunity filter);

    OrganizationSearchResultsYouth SearchOrganizationYouth(OrganizationSearchFilterYouth filter);

    OrganizationSearchResultsSSO SearchOrganizationSSO(OrganizationSearchFilterSSO filter);
  }
}
