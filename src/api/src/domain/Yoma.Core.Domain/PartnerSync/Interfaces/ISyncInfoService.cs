namespace Yoma.Core.Domain.PartnerSync.Interfaces
{
  public interface ISyncInfoService
  {
    (bool IsSynced, Core.SyncPartner? Partner) IsSynced(SyncType syncType, EntityType entityType, Guid entityId);

    (bool IsSynced, Core.SyncPartner? Partner) IsSynced(SyncType syncType, EntityType entityType, Guid entityId, bool? abortIfPossible);

    Task<(bool IsSynced, Core.SyncPartner? Partner)> IsSyncedAsync(SyncType syncType, EntityType entityType, Guid entityId);

    Task<(bool IsSynced, Core.SyncPartner? Partner)> IsSyncedAsync(SyncType syncType, EntityType entityType, Guid entityId, bool? abortIfPossible);
  }
}
