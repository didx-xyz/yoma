using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Domain.SSI.Interfaces
{
    public interface ISSITenantCreationService
    {
        string? GetTenantIdOrNull(EntityType entityType, Guid entityId);

        Task Create(EntityType entityType, Guid entityId);

        List<SSITenantCreation> ListPendingCreation(int batchSize);

        Task Update(SSITenantCreation item);
    }
}
