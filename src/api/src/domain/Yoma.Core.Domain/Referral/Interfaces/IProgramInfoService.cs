using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface IProgramInfoService
  {
    bool Available();

    ProgramInfo GetDefault();

    ProgramInfo GetById(Guid id, bool includeChildItems, bool includeComputed);

    ProgramSearchResultsInfo Search(ProgramSearchFilter filter);
  }
}
