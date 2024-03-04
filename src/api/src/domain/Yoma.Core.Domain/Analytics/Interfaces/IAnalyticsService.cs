using Yoma.Core.Domain.Analytics.Models;

namespace Yoma.Core.Domain.Analytics.Interfaces
{
    public interface IAnalyticsService
    {
        OrganizationSearchResultsSummary SearchOrganizationSummary(OrganizationSearchFilterSummary filter);
    }
}
