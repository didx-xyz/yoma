using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Lookups.Interfaces
{
  public interface ICountryService
  {
    Country GetByName(string name);

    Country? GetByNameOrNull(string name);

    Country GetByCodeAplha2(string name);

    Country? GetByCodeAplha2OrNull(string name);

    Country GetById(Guid id);

    Country? GetByIdOrNull(Guid id);

    List<Country> List();
  }
}
