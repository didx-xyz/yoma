using Yoma.Core.Domain.Entity.Models.Lookups;

namespace Yoma.Core.Domain.Entity.Interfaces.Lookups
{
  public interface IOrganizationProviderTypeService
  {
    OrganizationProviderType GetById(Guid id);

    OrganizationProviderType? GetByIdOrNull(Guid id);

    List<OrganizationProviderType> List();
  }
}
