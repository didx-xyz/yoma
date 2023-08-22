using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Interfaces
{
    public interface IOrganizationService
    {
        Organization GetById(Guid id, bool includeChildItems, bool ensureOrganizationAuthorization);

        Organization? GetByIdOrNull(Guid id, bool includeChildItems);

        Organization? GetByNameOrNull(string name, bool includeChildItems);

        List<Organization> Contains(string value);

        OrganizationSearchResults Search(OrganizationSearchFilter filter);

        Task<Organization> Upsert(OrganizationRequest request, bool ensureOrganizationAuthorization);

        Task UpdateStatus(Guid id, OrganizationStatus status, bool ensureOrganizationAuthorization);

        Task AssignProviderTypes(Guid id, List<Guid> providerTypeIds, bool ensureOrganizationAuthorization);

        Task DeleteProviderTypes(Guid id, List<Guid> providerTypeIds, bool ensureOrganizationAuthorization);

        Task<Organization> UpsertLogo(Guid id, IFormFile? file, bool ensureOrganizationAuthorization);

        Task<Organization> UpsertRegistrationDocument(Guid id, IFormFile? file, bool ensureOrganizationAuthorization);

        bool IsAdmin(Guid id, bool throwUnauthorized);

        bool IsAdminsOf(List<Guid> ids, bool throwUnauthorized);

        List<User> ListAdmins(Guid id, bool ensureOrganizationAuthorization);

        List<Organization> ListAdminsOf();

        Task AssignAdmin(Guid id, Guid userId, bool ensureOrganizationAuthorization);

        Task RemoveAdmin(Guid id, Guid userId, bool ensureOrganizationAuthorization);
    }
}
