using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Lookups.Interfaces
{
  public interface IEducationService
  {
    Education GetByName(string name);

    Education? GetByNameOrNull(string name);

    Education GetById(Guid id);

    Education? GetByIdOrNull(Guid id);

    List<Education> List();
  }
}
