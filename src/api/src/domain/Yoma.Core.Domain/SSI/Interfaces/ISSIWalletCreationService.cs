using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Domain.SSI.Interfaces
{
    public interface ISSIWalletCreationService
    {
        string? GetWalletIdNull(EntityType entityType, Guid entityId);

        Task Create(EntityType entityType, Guid entityId);

        List<SSIWalletCreation> ListPendingCreation(int batchSize);

        Task Update(SSIWalletCreation item);
    }
}
