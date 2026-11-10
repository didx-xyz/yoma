using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Infrastructure.DidxMe.Models;

namespace Yoma.Core.Infrastructure.DidxMe.Interfaces
{
  public interface IHolderService
  {
    Task<HolderContext> GetContext(string tenantId);

    /// <summary>
    /// Explicit service-authorized context for issuance and recovery; never an interactive fallback.
    /// </summary>
    Task<HolderContext> GetBackgroundContext(string tenantId);

    Task<Credential> GetCredentialById(string tenantId, string id);

    Task<Credential> GetCredential(HolderContext context, string id);

    Task<List<Credential>> ListCredentials(string tenantId);

    Task<Credential?> GetCredentialByClientReferentOrNull(string tenantId, ArtifactType artifactType, KeyValuePair<string, string> clientReferent);

    Task<Credential?> GetCredentialByClientReferentOrNull(HolderContext context, ArtifactType artifactType, KeyValuePair<string, string> clientReferent);

    Task<Credential?> GetCredentialByIdOrNull(string tenantId, ArtifactType artifactType, string id);

    Task DeleteCredential(string tenantId, ArtifactType artifactType, string id);
  }
}
