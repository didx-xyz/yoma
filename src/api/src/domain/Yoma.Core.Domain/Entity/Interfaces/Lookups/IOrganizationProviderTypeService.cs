namespace Yoma.Core.Domain.Entity.Interfaces.Lookups
{
    public interface IOrganizationProviderTypeService
    {
        Models.Lookups.OrganizationProviderType GetById(Guid id);

        Models.Lookups.OrganizationProviderType? GetByIdOrNull(Guid id);

        List<Models.Lookups.OrganizationProviderType> List();
    }
}
