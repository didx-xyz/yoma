using Yoma.Core.Domain.PartnerSharing.Models;

namespace Yoma.Core.Domain.PartnerSharing.Interfaces
{
  public interface ISharingService
  {
    Task ScheduleCreate(EntityType entityType, Guid entityId);

    Task ScheduleUpdate(EntityType entityType, Guid entityId);

    Task ScheduleDelete(EntityType entityType, Guid entityId);

    List<ProcessingLog> ListPendingSchedule(int batchSize, List<Guid> idsToSkip);

    Task UpdateSchedule(ProcessingLog item);
  }
}
