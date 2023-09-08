using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Interfaces
{
    public interface IOrganizationService
    {
        bool Updatable(Guid id, bool throwNotFound);

        Organization GetById(Guid id, bool includeChildItems, bool ensureOrganizationAuthorization);

        Organization? GetByIdOrNull(Guid id, bool includeChildItems);

        Organization? GetByNameOrNull(string name, bool includeChildItems);

        List<Organization> Contains(string value);

        OrganizationSearchResults Search(OrganizationSearchFilter filter);

        Task<Organization> Create(OrganizationRequestCreate request);

        Task<Organization> Update(OrganizationRequestUpdate request, bool ensureOrganizationAuthorization);

        Task<Organization> UpdateStatus(Guid id, OrganizationRequestUpdateStatus request, bool ensureOrganizationAuthorization);

        Task<Organization> AssignProviderTypes(Guid id, List<Guid> providerTypeIds, bool ensureOrganizationAuthorization);

        Task<Organization> RemoveProviderTypes(Guid id, List<Guid> providerTypeIds, bool ensureOrganizationAuthorization);

        Task<Organization> UpsertLogo(Guid id, IFormFile? file, bool ensureOrganizationAuthorization);

        Task<Organization> UpsertDocuments(Guid id, OrganizationDocumentType type, List<IFormFile> documents, bool ensureOrganizationAuthorization);

        bool IsAdmin(Guid id, bool throwUnauthorized);

        bool IsAdminsOf(List<Guid> ids, bool throwUnauthorized);

        List<UserInfo> ListAdmins(Guid id, bool ensureOrganizationAuthorization);

        List<OrganizationInfo> ListAdminsOf();

        Task<Organization> AssignAdmin(Guid id, string email, bool ensureOrganizationAuthorization);

        Task<Organization> RemoveAdmin(Guid id, string email, bool ensureOrganizationAuthorization);
    }
}
