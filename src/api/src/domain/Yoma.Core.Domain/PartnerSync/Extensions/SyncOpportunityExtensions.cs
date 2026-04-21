using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Extensions
{
  public static class SyncOpportunityExtensions
  {
    #region Public Methods
    public static SyncAction ResolveSyncAction(this SyncItemOpportunity opportunityItem, ProcessingLog? scheduleItemExisting)
    {
      ArgumentNullException.ThrowIfNull(opportunityItem);

      return opportunityItem.Deleted == true
        ? SyncAction.Delete
        : scheduleItemExisting == null ? SyncAction.Create : SyncAction.Update;
    }

    public static bool ReachedTotalCount(this SyncResultPull<SyncItemOpportunity> result, int pageNumber, int pageSize)
    {
      ArgumentNullException.ThrowIfNull(result);
      ArgumentOutOfRangeException.ThrowIfNegativeOrZero(pageNumber);
      ArgumentOutOfRangeException.ThrowIfNegativeOrZero(pageSize);

      return pageNumber * pageSize >= result.TotalCount!.Value;
    }

    public static void MapCountries(this SyncItemOpportunity opportunityItem, Func<string, Guid> resolveCountryId)
    {
      ArgumentNullException.ThrowIfNull(opportunityItem);
      ArgumentNullException.ThrowIfNull(resolveCountryId);

      if (opportunityItem.CountriesCodeAlpha2 == null || opportunityItem.CountriesCodeAlpha2.Count == 0) return;

      opportunityItem.Countries = [.. opportunityItem.CountriesCodeAlpha2.Select(resolveCountryId)];
    }
    #endregion
  }
}
