using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Interfaces
{
  public interface IOrganizationService
  {
    bool Updatable(Guid id, bool throwNotFound);

    Organization GetById(Guid id, bool includeChildItems, bool includeComputed, bool ensureOrganizationAuthorization);

    Organization? GetByIdOrNull(Guid id, bool includeChildItems, bool includeComputed, bool ensureOrganizationAuthorization);

    Organization? GetByNameOrNull(string name, bool includeChildItems, bool includeComputed);

    List<Organization> Contains(string value, bool includeComputed);

    OrganizationSearchResults Search(OrganizationSearchFilter filter, bool ensureOrganizationAuthorization);

    Task<Organization> Create(OrganizationRequestCreate request);

    Task<Organization> Update(OrganizationRequestUpdate request, bool ensureOrganizationAuthorization);

    Task<Organization> UpdateStatus(Guid id, OrganizationRequestUpdateStatus request, bool ensureOrganizationAuthorization);

    Task<Organization> AssignProviderTypes(Guid id, List<Guid> providerTypeIds, bool ensureOrganizationAuthorization);

    Task<Organization> RemoveProviderTypes(Guid id, List<Guid> providerTypeIds, bool ensureOrganizationAuthorization);

    Task<Organization> UpdateLogo(Guid id, IFormFile? file, bool ensureOrganizationAuthorization);

    Task<Organization> AddDocuments(Guid id, OrganizationDocumentType type, List<IFormFile> documents, bool ensureOrganizationAuthorization);

    Task<Organization> DeleteDocuments(Guid id, OrganizationDocumentType type, List<Guid> documentsIds, bool ensureOrganizationAuthorization);

    bool IsAdmin(Guid id, bool throwUnauthorized);

    bool IsAdminsOf(List<Guid> ids, bool throwUnauthorized);

    List<UserInfo> ListAdmins(Guid id, bool includeComputed, bool ensureOrganizationAuthorization);

    List<OrganizationInfo> ListAdminsOf(bool includeComputed);

    Task<Organization> AssignAdmins(Guid id, List<string> emails, bool ensureOrganizationAuthorization);

    Task<Organization> RemoveAdmins(Guid id, List<string> emails, bool ensureOrganizationAuthorization);
  }
}
