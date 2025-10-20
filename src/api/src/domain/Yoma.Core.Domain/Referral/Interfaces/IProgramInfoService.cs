using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface IProgramInfoService
  {
    ProgramInfo GetById(Guid id);

    ProgramSearchResultsInfo Search(ProgramSearchFilter filter);
  }
}
