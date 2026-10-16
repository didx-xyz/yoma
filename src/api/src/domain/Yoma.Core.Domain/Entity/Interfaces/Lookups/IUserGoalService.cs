namespace Yoma.Core.Domain.Entity.Interfaces.Lookups
{
  public interface IUserGoalService
  {
    Models.Lookups.UserGoal GetByName(string name);

    Models.Lookups.UserGoal? GetByNameOrNull(string name);

    Models.Lookups.UserGoal GetById(Guid id);

    Models.Lookups.UserGoal? GetByIdOrNull(Guid id);

    List<Models.Lookups.UserGoal> List();
  }
}
