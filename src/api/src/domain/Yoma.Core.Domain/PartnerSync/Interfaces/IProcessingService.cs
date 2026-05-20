using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Interfaces
{
  public interface IProcessingService
  {
    Task<ProcessingLog> RecordPull(SyncAction action, Guid partnerId, EntityType entityType, string entityExternalId, Guid? entityId, string? payloadHash);

    ProcessingLog? GetPull(Guid partnerId, EntityType entityType, string entityExternalId);

    Task RecordPullError(SyncAction action, Guid partnerId, EntityType entityType, string entityExternalId, Guid? entityId, string errorReason);

    Task ScheduleCreatePush(EntityType entityType, Guid entityId);

    Task ScheduleUpdatePush(EntityType entityType, Guid entityId, bool canCreate);

    Task ScheduleDeletePush(EntityType entityType, Guid entityId);

    List<(Guid PartnerId, EntityType EntityType, List<ProcessingLog> Items)> ListPendingPush(int batchSize, List<Guid> idsToSkip);

    Task UpdatePush(ProcessingLog item);

    PartnerSyncTracking? GetTrackingLatest(SyncType syncType, Guid partnerId, EntityType entityType, SyncScope syncScope);

    Task RecordTracking(SyncType syncType, Guid partnerId, EntityType entityType, SyncScope syncScope, DateTimeOffset dateStamp, int itemsProcessed, int itemsSucceeded, int itemsSkipped, int itemsFailed);

    Task RecordTracking(SyncType syncType, Guid partnerId, EntityType entityType, SyncScope syncScope, DateTimeOffset dateStamp, string failedReason);
  }
}
