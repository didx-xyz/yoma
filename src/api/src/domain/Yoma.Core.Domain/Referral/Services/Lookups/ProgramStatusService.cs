using Yoma.Core.Domain.Referral.Interfaces.Lookups;

namespace Yoma.Core.Domain.Referral.Services.Lookups
{
  public class ProgramStatusService : IReferralProgramStatusService
  {
    public Models.Lookups.ProgramStatus GetById(Guid id)
    {
      throw new NotImplementedException();
    }

    public Models.Lookups.ProgramStatus? GetByIdOrNull(Guid id)
    {
      throw new NotImplementedException();
    }

    public Models.Lookups.ProgramStatus GetByName(string name)
    {
      throw new NotImplementedException();
    }

    public Models.Lookups.ProgramStatus? GetByNameOrNull(string name)
    {
      throw new NotImplementedException();
    }

    public List<Models.Lookups.ProgramStatus> List()
    {
      throw new NotImplementedException();
    }
  }
}
