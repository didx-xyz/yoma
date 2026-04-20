namespace Yoma.Core.Domain.PartnerSync.Interfaces
{
  public interface ISyncInfoService
  {
    Task<bool> IsSynced(SyncType syncType, EntityType entityType, Guid entityId, bool abortIfPossible);
  }
}
