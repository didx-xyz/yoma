using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Models.Provider;

namespace Yoma.Core.Infrastructure.DidxMe.Services
{
  /// <summary>
  /// Explicit capability boundary for the provider facade. Recovery temporarily returns null
  /// whenever this adapter is selected; it is not automatically gated by environment. Required
  /// background access must be resolved before production use. Online holder tokens do not provide it.
  /// </summary>
  public class BackgroundWalletService
  {
    #region Public Members
    // TODO YOM-1309: replace this temporary issuance-only bypass with real recovery agreed with DIDx.
    // Adrian explicitly requested null to unblock development of issuance. This does NOT confirm
    // remote absence and can duplicate a credential after provider success/local persistence failure.
    public Task<Credential?> GetCredentialByClientReferentOrNull(
      string tenantId,
      ArtifactType artifactType,
      KeyValuePair<string, string> clientReferent)
    {
      PresetService.ValidateArtifactType(artifactType);
      return Task.FromResult<Credential?>(null);
    }

    // TODO YOM-1309: resolve the exact held credential through supported background authorization.
    // Do not substitute issuer state or an authentication failure for confirmed wallet absence.
    public Task<Credential?> GetCredentialByIdOrNull(string tenantId, ArtifactType artifactType, string id)
    {
      PresetService.ValidateArtifactType(artifactType);
      throw new NotSupportedException("YOM-1309: didx:me background credential lookup is not implemented");
    }

    // TODO YOM-1309: implement actual holder deletion and absence verification for Replay.
    // Keep the original issuance date for reissuance. Revocation is not holder deletion.
    public Task DeleteCredential(string tenantId, ArtifactType artifactType, string id)
    {
      PresetService.ValidateArtifactType(artifactType);
      throw new NotSupportedException("YOM-1309: didx:me background Replay deletion requires a supported holder authorization route");
    }
    #endregion
  }
}
