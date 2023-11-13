using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Domain.SSI.Interfaces
{
    public interface ISSICredentialService
    {
        Task ScheduleIssuance(string schemaName, Guid entityId);

        List<SSICredentialIssuance> ListPendingIssuanceSchedule(int batchSize);

        Task UpdateScheduleIssuance(SSICredentialIssuance item);
    }
}
