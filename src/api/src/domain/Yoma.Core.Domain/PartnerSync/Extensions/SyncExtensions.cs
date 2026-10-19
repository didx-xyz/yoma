using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Extensions
{
  public static class SyncExtensions
  {
    #region Public Methods
    /// <summary>
    /// Completes an authoritative snapshot of the provider's declared custom-field keys.
    /// Missing mapped values become key-only PATCH deletions; keys outside this ownership set
    /// remain omitted and preserved. Use only when an absent/unmappable source value withdraws
    /// the provider's previous value, never for partial payloads or an inferred list of all CFs.
    /// Normalization, validation and persistence remain in the common custom-field framework.
    /// </summary>
    public static List<CustomFieldValueRequest> CompleteCustomFieldSnapshot(
      this List<CustomFieldValueRequest> fields,
      params string[] ownedKeys)
    {
      ArgumentNullException.ThrowIfNull(fields);
      ArgumentNullException.ThrowIfNull(ownedKeys);

      var existingKeys = fields.Select(o => o.Key).ToHashSet(StringComparer.OrdinalIgnoreCase);
      foreach (var key in ownedKeys)
      {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);

        if (existingKeys.Add(key)) fields.Add(new CustomFieldValueRequest { Key = key });
      }

      return fields;
    }

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

      // For MyOpportunity pull logs, the FK can be set null after partner cancellation/pending purge
      // hard-deletes the MyOpportunity. In that case the log remains as audit history, but no longer
      // points to a live synchronized entity.
      return entityType switch
      {
        EntityType.Opportunity => item.OpportunityId.HasValue,
        EntityType.MyOpportunity => item.MyOpportunityId.HasValue,
        _ => throw new InvalidOperationException($"Entity type of '{entityType}' not supported")
      };
    }

    public static bool ReachedTotalCount<TItem>(this SyncResultPullEntity<TItem> result, int pageNumber, int pageSize)
      where TItem : class, new()
    {
      ArgumentNullException.ThrowIfNull(result);

      return ReachedTotalCount(result.TotalCount, pageNumber, pageSize);
    }

    public static bool ReachedTotalCount(this SyncResultPullVerification result, int pageNumber, int pageSize)
    {
      ArgumentNullException.ThrowIfNull(result);

      return ReachedTotalCount(result.TotalCount, pageNumber, pageSize);
    }
    #endregion

    #region Private Members
    private static bool ReachedTotalCount(int? totalCount, int pageNumber, int pageSize)
    {
      ArgumentOutOfRangeException.ThrowIfNegativeOrZero(pageNumber);
      ArgumentOutOfRangeException.ThrowIfNegativeOrZero(pageSize);

      if (!totalCount.HasValue)
        throw new InvalidOperationException("Paginated result: Total count expected but is null");

      return pageNumber * pageSize >= totalCount.Value;
    }
    #endregion
  }
}
