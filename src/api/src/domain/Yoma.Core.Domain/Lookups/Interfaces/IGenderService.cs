using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Lookups.Interfaces
{
  public interface IGenderService
  {
    Gender GetByName(string name);

    Gender? GetByNameOrNull(string name);

    Gender GetById(Guid id);

    Gender? GetByIdOrNull(Guid id);

    List<Gender> List();
  }
}
