using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Interfaces
{
  public interface IProcessingService
  {
    Task<ProcessingLog> RecordPull(SyncAction action, Guid partnerId, EntityType entityType, string entityExternalId, Guid? entityId);

    ProcessingLog? GetPull(Guid partnerId, EntityType entityType, string entityExternalId);

    Task RecordPullError(SyncAction action, Guid partnerId, EntityType entityType, string entityExternalId, Guid? entityId, string errorReason);

    Task ScheduleCreatePush(EntityType entityType, Guid entityId);

    Task ScheduleUpdatePush(EntityType entityType, Guid entityId, bool canCreate);

    Task ScheduleDeletePush(EntityType entityType, Guid entityId);

    List<ProcessingLog> ListPendingPush(int batchSize, List<Guid> idsToSkip);

    Task UpdatePush(ProcessingLog item);
  }
}
