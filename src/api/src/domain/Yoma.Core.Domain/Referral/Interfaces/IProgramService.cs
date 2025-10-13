using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface IProgramService
  {
    Program GetById(Guid id, bool includeChildItems, bool includeComputed);

    Program? GetByIdOrNull(Guid id, bool includeChildItems, bool includeComputed);

    Program? GetByNameOrNull(string title, bool includeChildItems, bool includeComputed);

    ProgramSearchResults Search(ProgramSearchFilter filter);

    Task<Program> Create(ProgramRequestCreate request);

    Task<Program> Update(ProgramRequestUpdate request);

    Task<Program> UpdateStatus(Guid id, ProgramStatus status);
  }
}
