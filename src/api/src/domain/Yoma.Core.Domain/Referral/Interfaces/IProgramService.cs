using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface IProgramService
  {
    Program GetById(Guid id, bool includeChildItems, bool includeComputed);

    Program? GetByIdOrNull(Guid id, bool includeChildItems, bool includeComputed);

    Program? GetByNameOrNull(string name, bool includeChildItems, bool includeComputed);

    ProgramSearchResults Search(ProgramSearchFilter filter);

    ProgramSearchResults Search(ProgramSearchFilterAdmin filter);

    Task<Program> Create(ProgramRequestCreate request);

    Task<Program> Update(ProgramRequestUpdate request);

    Task<ProgramInfo> UpdateImage(Guid id, IFormFile file);

    Task<ProgramInfo> UpdateStatus(Guid id, ProgramStatus status);

    Task<ProgramInfo> SetAsDefault(Guid id);
  }
}
