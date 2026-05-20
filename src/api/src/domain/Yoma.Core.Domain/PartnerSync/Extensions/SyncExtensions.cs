using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Extensions
{
  public static class SyncExtensions
  {
    #region Public Methods
    public static SyncAction ResolveSyncAction<TItem>(
      this SyncItemEntity<TItem> item,
      EntityType entityType,
      ProcessingLog? processingItemExisting)
      where TItem : class, new()
    {
      ArgumentNullException.ThrowIfNull(item);

      if (item.Deleted == true) return SyncAction.Delete;

      return processingItemExisting.HasSynchronizedEntity(entityType)
        ? SyncAction.Update
        : SyncAction.Create;
    }

    public static bool HasSynchronizedEntity(this ProcessingLog? item, EntityType entityType)
    {
      if (item == null) return false;

      return entityType switch
      {
        EntityType.Opportunity => item.OpportunityId.HasValue,
        _ => throw new InvalidOperationException($"Entity type of '{entityType}' not supported")
      };
    }

    public static bool ReachedTotalCount<TItem>(this SyncResultPullEntity<TItem> result, int pageNumber, int pageSize)
      where TItem : class, new()
    {
      ArgumentNullException.ThrowIfNull(result);
      ArgumentOutOfRangeException.ThrowIfNegativeOrZero(pageNumber);
      ArgumentOutOfRangeException.ThrowIfNegativeOrZero(pageSize);

      return pageNumber * pageSize >= result.TotalCount!.Value;
    }
    #endregion
  }
}
