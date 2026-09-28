using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Lookups.Interfaces
{
  public interface IAccessibilityService
  {
    Accessibility GetByName(string name);

    Accessibility? GetByNameOrNull(string name);

    Accessibility GetById(Guid id);

    Accessibility? GetByIdOrNull(Guid id);

    List<Accessibility> List();
  }
}
