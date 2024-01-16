using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Domain.SSI.Interfaces
{
    public interface ISSITenantService
    {
        string GetTenantId(EntityType entityType, Guid entityId);

        string? GetTenantIdOrNull(EntityType entityType, Guid entityId);

        Task ScheduleCreation(EntityType entityType, Guid entityId);

        List<SSITenantCreation> ListPendingCreationSchedule(int batchSize, List<Guid> idsToSkip);

        Task UpdateScheduleCreation(SSITenantCreation item);
    }
}
