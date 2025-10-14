using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Interfaces.Lookups
{
  public interface IReferralService
  {
    ReferralStatusResponse GetStatus();

    ProgramInfo GetProgramAndStatusById(Guid id, bool includeStatus);
  }
}
