using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Lookups.Interfaces
{
  public interface ISustainableDevelopmentGoalService
  {
    SustainableDevelopmentGoal GetByName(string name);

    SustainableDevelopmentGoal? GetByNameOrNull(string name);

    SustainableDevelopmentGoal GetById(Guid id);

    SustainableDevelopmentGoal? GetByIdOrNull(Guid id);

    List<SustainableDevelopmentGoal> List();
  }
}
