using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Interfaces
{
  public interface IOrganizationService
  {
    Organization GetById(Guid id);

    Task<Organization> Upsert(OrganizationRequest request);

    List<Models.Lookups.OrganizationProviderType> ListProviderTypesById(Guid id);

    Task AssignProviderTypes(Guid id, List<Guid> providerTypeIds);

    Task DeleteProviderTypes(Guid id, List<Guid> providerTypeIds);

    Task<Organization> UpsertLogo(Guid id, IFormFile? file);

    Task<Organization> UpsertRegistrationDocument(Guid id, IFormFile? file);

    Task AssignAdmin(Guid organizationId, Guid userId);

    Task RemoveAdmin(Guid organizationId, Guid userId);
  }
}
