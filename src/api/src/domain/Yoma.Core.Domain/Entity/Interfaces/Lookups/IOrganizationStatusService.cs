namespace Yoma.Core.Domain.Entity.Interfaces.Lookups
{
  public interface IOrganizationStatusService
  {
    Models.Lookups.OrganizationStatus GetByName(string name);

    Models.Lookups.OrganizationStatus? GetByNameOrNull(string name);

    Models.Lookups.OrganizationStatus GetById(Guid id);

    Models.Lookups.OrganizationStatus? GetByIdOrNull(Guid id);

    List<Models.Lookups.OrganizationStatus> List();
  }
}
