using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Extensions
{
  public static class SyncExtensions
  {
    #region Public Methods
    public static SyncAction ResolveSyncAction<TItem>(this SyncItem<TItem> item, ProcessingLog? processingItemExisting)
      where TItem : class, new()
    {
      ArgumentNullException.ThrowIfNull(item);

      return item.Deleted == true ? SyncAction.Delete : processingItemExisting == null ? SyncAction.Create : SyncAction.Update;
    }

    public static bool ReachedTotalCount<TItem>(this SyncResultPull<TItem> result, int pageNumber, int pageSize)
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
