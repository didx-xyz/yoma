using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Lookups.Interfaces
{
  public interface IEngagementTypeService
  {
    EngagementType GetByName(string name);

    EngagementType? GetByNameOrNull(string name);

    EngagementType GetById(Guid id);

    EngagementType? GetByIdOrNull(Guid id);

    List<EngagementType> List();
  }
}
