using Yoma.Core.Domain.Analytics.Models;

namespace Yoma.Core.Domain.Analytics.Interfaces
{
  public interface IAnalyticsService
  {
    OrganizationSearchResultsEngagement SearchOrganizationEngagement(OrganizationSearchFilterEngagement filter);

    OrganizationSearchResultsOpportunity SearchOrganizationOpportunities(OrganizationSearchFilterOpportunity filter);

    OrganizationSearchResultsYouth SearchOrganizationYouth(OrganizationSearchFilterYouth filter);
  }
}
