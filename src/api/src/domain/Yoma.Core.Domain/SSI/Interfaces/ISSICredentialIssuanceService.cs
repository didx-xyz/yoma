using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Domain.SSI.Interfaces
{
    public interface ISSICredentialIssuanceService
    {
        Task Create(string schemaName, Guid entityId);

        List<SSICredentialIssuance> ListPendingIssuance(int batchSize);

        Task Update(SSICredentialIssuance item);
    }
}
