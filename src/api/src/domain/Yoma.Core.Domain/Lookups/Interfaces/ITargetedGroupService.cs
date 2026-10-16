using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Lookups.Interfaces
{
  public interface ITargetedGroupService
  {
    TargetedGroup GetByName(string name);

    TargetedGroup? GetByNameOrNull(string name);

    TargetedGroup GetById(Guid id);

    TargetedGroup? GetByIdOrNull(Guid id);

    List<TargetedGroup> List();
  }
}
