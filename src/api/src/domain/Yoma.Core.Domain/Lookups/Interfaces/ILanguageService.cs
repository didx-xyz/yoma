using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Lookups.Interfaces
{
  public interface ILanguageService
  {
    Language GetByName(string name);

    Language? GetByNameOrNull(string name);

    Language GetByCodeAplha2(string name);

    Language? GetByCodeAplha2OrNull(string name);

    Language GetById(Guid id);

    Language? GetByIdOrNull(Guid id);

    List<Language> List();
  }
}
