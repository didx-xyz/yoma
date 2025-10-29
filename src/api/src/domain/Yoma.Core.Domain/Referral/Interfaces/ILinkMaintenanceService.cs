using Microsoft.Extensions.Logging;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface ILinkMaintenanceService
  {
    Task CancelByUserId(Guid userId);

    Task CancelByProgramId(Guid programId, ILogger? logger = null);

    Task CancelByProgramId(List<Guid> programIds, ILogger? logger = null);

    Task ExpireByProgramId(List<Guid> programIds, ILogger? logger = null);
  }
}
