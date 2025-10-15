using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Services
{
  public class ReferralService : IReferralService
  {
    public ReferralStatusResponse GetStatus()
    {
      throw new NotImplementedException();
    }

    public ProgramInfo GetProgramAndStatusById(Guid id, bool includeStatus)
    {
      throw new NotImplementedException();
    }
  }
}
