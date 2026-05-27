using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Interfaces
{
  public interface ISyncStateService
  {
    SyncInfoEntity? ListSyncInfo(EntityType entityType, Guid entityId, string? url);

    SyncInfoUser? ListUserSyncInfo(Guid userId);

    SyncInfoUserPartner? GetUserSyncInfo(Guid userId, SyncPartner partner);

    Task UpsertUserSyncInfo(Guid userId, string username, string? email, string? phoneNumber, SyncInfoUserPartner syncInfo);

    Task<bool> AbortSyncPushCreateIfPossible(EntityType entityType, Guid entityId);
  }
}
