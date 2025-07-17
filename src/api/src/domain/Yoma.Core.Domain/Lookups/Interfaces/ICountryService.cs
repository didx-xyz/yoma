namespace Yoma.Core.Domain.Lookups.Interfaces
{
  public interface ICountryService
  {
    Models.Country GetByName(string name);

    Models.Country? GetByNameOrNull(string name);

    Models.Country GetByCodeAplha2(string name);

    Models.Country? GetByCodeAplha2OrNull(string name);

    Models.Country GetById(Guid id);

    Models.Country? GetByIdOrNull(Guid id);

    List<Models.Country> List(bool? excludeWorldwide = null);
  }
}
