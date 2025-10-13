using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface IReferralProgramService
  {
    ReferralProgram GetById(Guid id, bool includeChildItems, bool includeComputed);

    ReferralProgram? GetByIdOrNull(Guid id, bool includeChildItems, bool includeComputed);

    ReferralProgram? GetByNameOrNull(string title, bool includeChildItems, bool includeComputed);

    ReferralProgramSearchResults Search(ReferralProgramSearchFilter filter);

    Task<ReferralProgram> Create(ReferralProgramRequestCreate request);

    Task<ReferralProgram> Update(ReferralProgramRequestUpdate request);

    Task<ReferralProgram> UpdateStatus(Guid id, ProgramStatus status);
  }
}
