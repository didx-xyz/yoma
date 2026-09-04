using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Domain.SSI.Interfaces
{
  public interface ISSICredentialService
  {
    /// <summary>
    /// Schedule credential issuance using the specified full schema name.
    /// </summary>
    /// <param name="schemaName">Full schema name.</param>
    /// <param name="entityId">Identifier of the entity represented by the credential.</param>
    Task ScheduleIssuance(string schemaName, Guid entityId);

    List<SSICredentialIssuance> ListPendingIssuanceSchedule(int batchSize, List<Guid> idsToSkip);

    Task UpdateScheduleIssuance(SSICredentialIssuance item);
  }
}
