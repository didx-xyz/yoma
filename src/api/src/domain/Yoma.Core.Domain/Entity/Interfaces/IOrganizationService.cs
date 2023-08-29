using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Interfaces
{
    public interface IOrganizationService
    {
        bool Active(Guid id, bool throwNotFound);

        bool Updatable(Guid id, bool throwNotFound);

        Organization GetById(Guid id, bool includeChildItems, bool ensureOrganizationAuthorization);

        Organization? GetByIdOrNull(Guid id, bool includeChildItems);

        Organization? GetByNameOrNull(string name, bool includeChildItems);

        List<Organization> Contains(string value);

        OrganizationSearchResults Search(OrganizationSearchFilter filter);

        Task<Organization> Create(OrganizationCreateRequest request);

        Task<Organization> Update(OrganizationUpdateRequest request, bool ensureOrganizationAuthorization);

        Task UpdateStatus(Guid id, OrganizationStatus status, bool ensureOrganizationAuthorization);

        Task<Organization> AssignProviderTypes(Guid id, List<Guid> providerTypeIds, bool ensureOrganizationAuthorization);

        Task<Organization> DeleteProviderTypes(Guid id, List<Guid> providerTypeIds, bool ensureOrganizationAuthorization);

        Task<Organization> UpsertLogo(Guid id, IFormFile? file, bool ensureOrganizationAuthorization);

        Task<Organization> UpsertDocuments(Guid id, OrganizationDocumentType type, List<IFormFile> documents, bool ensureOrganizationAuthorization);

        bool IsAdmin(Guid id, bool throwUnauthorized);

        bool IsAdminsOf(List<Guid> ids, bool throwUnauthorized);

        List<UserInfo> ListAdmins(Guid id, bool ensureOrganizationAuthorization);

        List<OrganizationInfo> ListAdminsOf();

        Task AssignAdmin(Guid id, string email, bool ensureOrganizationAuthorization);

        Task RemoveAdmin(Guid id, string email, bool ensureOrganizationAuthorization);
    }
}
