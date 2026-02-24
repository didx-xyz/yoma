using Yoma.Core.Domain.Analytics.Models;

namespace Yoma.Core.Domain.Analytics.Interfaces
{
  public interface IAnalyticsService
  {
    List<Lookups.Models.Country> ListSearchCriteriaCountriesEngaged(List<Guid>? organizations);

    PlatformMetrics GetPlatformMetrics();

    PlatformMetricsAdmin GetPlatformMetricsAdmin();

    SearchResultsEngagement SearchEngagement(SearchFilterEngagement filter);

    SearchResultsOpportunity SearchOpportunities(SearchFilterOpportunity filter);

    SearchResultsYouth SearchYouth(SearchFilterYouth filter);

    SearchResultsSSO SearchSSO(SearchFilterSSO filter);
  }
}
