using Microsoft.Extensions.Logging;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface ILinkMaintenanceService
  {
    Task CancelByUserId(Guid userId);

    Task CancelByProgramId(Guid programId);

    Task ExpireByProgramId(List<Guid> programIds, ILogger? logger = null);
  }
}
