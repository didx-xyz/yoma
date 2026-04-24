using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Interfaces
{
  public interface ISyncStateService
  {
    SyncInfo? ListSyncInfo(EntityType entityType, Guid entityId);

    Task<bool> AbortSyncPushCreateIfPossible(EntityType entityType, Guid entityId);
  }
}
