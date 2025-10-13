using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Services
{
  public class ReferralProgramService : IReferralProgramService
  {
    public ReferralProgram GetById(Guid id, bool includeChildItems, bool includeComputed)
    {
      throw new NotImplementedException();
    }

    public ReferralProgram? GetByIdOrNull(Guid id, bool includeChildItems, bool includeComputed)
    {
      throw new NotImplementedException();
    }

    public ReferralProgram? GetByNameOrNull(string title, bool includeChildItems, bool includeComputed)
    {
      throw new NotImplementedException();
    }

    public ReferralProgramSearchResults Search(ReferralProgramSearchFilter filter)
    {
      throw new NotImplementedException();
    }

    public Task<ReferralProgram> Create(ReferralProgramRequestCreate request)
    {
      throw new NotImplementedException();
    }

    public Task<ReferralProgram> Update(ReferralProgramRequestUpdate request)
    {
      throw new NotImplementedException();
    }

    public Task<ReferralProgram> UpdateStatus(Guid id, Status status)
    {
      throw new NotImplementedException();
    }
  }
}
