using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Interfaces
{
  public interface ISyncService
  {
    Task<ProcessingLog> SchedulePull(SyncAction action, Guid partnerId, EntityType entityType, string entityExternalId, Guid? entityId);

    ProcessingLog? GetSchedulePull(Guid partnerId, EntityType entityType, string entityExternalId);

    Task UpdateSchedulePull(ProcessingLog item);

    Task ScheduleCreatePush(EntityType entityType, Guid entityId);

    Task ScheduleUpdatePush(EntityType entityType, Guid entityId, bool canCreate);

    Task ScheduleDeletePush(EntityType entityType, Guid entityId);

    List<ProcessingLog> ListSchedulePendingPush(int batchSize, List<Guid> idsToSkip);

    Task UpdateSchedulePush(ProcessingLog item);
  }
}
