using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Interfaces
{
  public interface ISyncStateService
  {
    SyncInfoEntity? GetSyncInfo(EntityType entityType, Guid entityId, string? url);

    SyncInfoMyOpportunity? GetSyncInfoMyOpportunity(Guid myOpportunityId);

    SyncInfoUser? GetUserSyncInfo(Guid userId);

    SyncInfoUserPartner? GetUserSyncInfo(SyncPartner partner, Guid userId);

    SyncInfoUserPartner? GetUserSyncInfo(SyncPartner partner, string externalId);

    Task UpsertUserSyncInfo(Guid userId, SyncInfoUserPartner syncInfo);

    Task<bool> AbortSyncPushCreateIfPossible(EntityType entityType, Guid entityId);
  }
}
