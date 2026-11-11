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

    /// <summary>
    /// Cleanup work is selected independently of issuance readiness; eligible retries remain Replay.
    /// </summary>
    List<SSICredentialIssuance> ListReplayIssuanceSchedule(int batchSize, List<Guid> idsToSkip);

    /// <summary>
    /// Schedule credential reissuance following a profile change.
    /// </summary>
    Task ScheduleReissuance(Guid userId);

    /// <summary>
    /// Process credential reissuance based on whether the issued attribute values have changed.
    /// </summary>
    Task ProcessReissuance(SSICredentialIssuance item, bool changed);

    List<SSICredentialIssuance> ListPendingReissuanceSchedule(int batchSize, List<Guid> idsToSkip);

    Task UpdateScheduleIssuance(SSICredentialIssuance item);
  }
}
