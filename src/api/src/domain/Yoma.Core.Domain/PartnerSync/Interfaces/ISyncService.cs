using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Interfaces
{
  public interface ISyncService
  {
    Task ScheduleCreatePush(EntityType entityType, Guid entityId);

    Task ScheduleUpdatePush(EntityType entityType, Guid entityId, bool canCreate);

    Task ScheduleDeletePush(EntityType entityType, Guid entityId);

    List<ProcessingLog> ListSchedulePendingPush(int batchSize, List<Guid> idsToSkip);

    Task UpdateSchedulePush(ProcessingLog item);

    Task LogPull(Guid partnerId, SyncAction action, EntityType entityType, Guid? entityId, string entityExternalId, string? errorReason = null);
  }
}
