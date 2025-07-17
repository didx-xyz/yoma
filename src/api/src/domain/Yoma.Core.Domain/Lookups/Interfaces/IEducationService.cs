namespace Yoma.Core.Domain.Lookups.Interfaces
{
  public interface IEducationService
  {
    Models.Education GetByName(string name);

    Models.Education? GetByNameOrNull(string name);

    Models.Education GetById(Guid id);

    Models.Education? GetByIdOrNull(Guid id);

    List<Models.Education> List();
  }
}
