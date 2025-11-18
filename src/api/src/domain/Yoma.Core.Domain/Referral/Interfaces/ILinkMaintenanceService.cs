using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface ILinkMaintenanceService
  {
    ReferralLink GetById(Guid id);

    Task LimitReachedByProgramId(Guid programId, ILogger? logger = null);

    Task LimitReachedByProgramId(List<Guid> programIds, ILogger? logger = null);

    Task CancelByUserId(Guid userId);

    Task CancelByProgramId(Guid programId, ILogger? logger = null);

    Task CancelByProgramId(List<Guid> programIds, ILogger? logger = null);

    Task ExpireByProgramId(List<Guid> programIds, ILogger? logger = null);
  }
}
