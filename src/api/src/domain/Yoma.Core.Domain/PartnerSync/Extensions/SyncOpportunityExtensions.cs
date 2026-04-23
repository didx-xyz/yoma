using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Extensions
{
  public static class SyncOpportunityExtensions
  {
    #region Public Methods
    public static SyncAction ResolveSyncAction<TItem>(this SyncItem<TItem> item, ProcessingLog? scheduleItemExisting)
      where TItem : class, new()
    {
      ArgumentNullException.ThrowIfNull(item);

      return item.Deleted == true ? SyncAction.Delete : scheduleItemExisting == null ? SyncAction.Create : SyncAction.Update;
    }

    public static bool ReachedTotalCount<TItem>(this SyncResultPull<TItem> result, int pageNumber, int pageSize)
      where TItem : class, new()
    {
      ArgumentNullException.ThrowIfNull(result);
      ArgumentOutOfRangeException.ThrowIfNegativeOrZero(pageNumber);
      ArgumentOutOfRangeException.ThrowIfNegativeOrZero(pageSize);

      return pageNumber * pageSize >= result.TotalCount!.Value;
    }

    //TODO: Update / complete mappings
    public static OpportunityRequestCreate ToRequestCreate(this Opportunity.Models.Opportunity item)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      if (item.OrganizationId == Guid.Empty)
        throw new ArgumentNullException(nameof(item), "Organization id is required");

      if (item.Countries == null || item.Countries.Count == 0)
        throw new ArgumentNullException(nameof(item), "One or more countries required");

      return new OpportunityRequestCreate
      {
        Title = item.Title,
        Description = item.Description,
        OrganizationId = item.OrganizationId,
        Summary = item.Summary,
        URL = item.URL,
        ExternalId = item.ExternalId,
        Countries = [.. item.Countries.Select(o => o.Id)],
        PostAsActive = true
      };
    }

    //TODO: Update / complete mappings
    public static OpportunityRequestUpdate ToRequestUpdate(this Opportunity.Models.Opportunity item, Guid id)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      if (item.OrganizationId == Guid.Empty)
        throw new ArgumentNullException(nameof(item), "Organization id is required");

      if (item.Countries == null || item.Countries.Count == 0)
        throw new ArgumentNullException(nameof(item), "One or more countries required");

      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id), "Id is required");

      return new OpportunityRequestUpdate
      {
        Id = id,
        Title = item.Title,
        Description = item.Description,
        OrganizationId = item.OrganizationId,
        Summary = item.Summary,
        URL = item.URL,
        ExternalId = item.ExternalId,
        Countries = [.. item.Countries.Select(o => o.Id)]
      };
    }
    #endregion
  }
}
