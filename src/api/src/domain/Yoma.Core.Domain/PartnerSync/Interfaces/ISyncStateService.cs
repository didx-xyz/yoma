using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Interfaces
{
  public interface ISyncStateService
  {
    SyncInfoEntity? GetSyncInfo(EntityType entityType, Guid entityId, string? url);

    /// <summary>
    /// Loads synchronization information for a set of entities in one query, preserving the
    /// single-entity selection and validation rules and each entity's supplied URL.
    /// Entities without synchronization information are returned with a null value.
    /// </summary>
    Dictionary<Guid, SyncInfoEntity?> GetSyncInfo(EntityType entityType, IReadOnlyDictionary<Guid, string?> entityUrls);

    SyncInfoMyOpportunity? GetSyncInfoMyOpportunity(Guid myOpportunityId);

    /// <summary>
    /// Loads verification synchronization information for a set of submissions in one query.
    /// Preserves the single-item pull-only rules and returns null for submissions without sync information.
    /// </summary>
    Dictionary<Guid, SyncInfoMyOpportunity?> GetSyncInfoMyOpportunity(IReadOnlyCollection<Guid> myOpportunityIds);

    SyncInfoUser? GetUserSyncInfo(Guid userId);

    SyncInfoUserPartner? GetUserSyncInfo(SyncPartner partner, Guid userId);

    SyncInfoUserPartner? GetUserSyncInfo(SyncPartner partner, string externalId);

    Task UpsertUserSyncInfo(Guid userId, SyncInfoUserPartner syncInfo);

    Task<bool> AbortSyncPushCreateIfPossible(EntityType entityType, Guid entityId);
  }
}
