using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Lookups.Interfaces
{
  public interface ICurrencyService
  {
    Currency GetByCode(string code);

    Currency? GetByCodeOrNull(string code);

    Currency GetById(Guid id);

    Currency? GetByIdOrNull(Guid id);

    List<Currency> List();
  }
}
