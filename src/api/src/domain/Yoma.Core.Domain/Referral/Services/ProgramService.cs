using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Services
{
  public class ProgramService : IProgramService
  {
    public Program GetById(Guid id, bool includeChildItems, bool includeComputed)
    {
      throw new NotImplementedException();
    }

    public Program? GetByIdOrNull(Guid id, bool includeChildItems, bool includeComputed)
    {
      throw new NotImplementedException();
    }

    public Program? GetByNameOrNull(string title, bool includeChildItems, bool includeComputed)
    {
      throw new NotImplementedException();
    }

    public ProgramSearchResults Search(ProgramSearchFilter filter)
    {
      throw new NotImplementedException();
    }

    public ProgramSearchResults Search(ProgramSearchFilterAdmin filter)
    {
      throw new NotImplementedException();
    }

    public Task<Program> Create(ProgramRequestCreate request)
    {
      throw new NotImplementedException();
    }

    public Task<Program> Update(ProgramRequestUpdate request)
    {
      throw new NotImplementedException();
    }

    public Task<ProgramInfo> UpdateStatus(Guid id, ProgramStatus status)
    {
      throw new NotImplementedException();
    }
  }
}
