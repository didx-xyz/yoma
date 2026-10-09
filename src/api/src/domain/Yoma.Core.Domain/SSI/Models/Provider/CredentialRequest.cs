namespace Yoma.Core.Domain.SSI.Models.Provider
{
  public class CredentialIssuanceRequest
  {
    public KeyValuePair<string, string> ClientReferent { get; set; }

    /// <summary>
    /// Immutable provider schema identity resolved for this issuance attempt.
    /// The provider must not resolve a newer version by name after claims have been mapped.
    /// </summary>
    public string SchemaId { get; set; } = null!;

    /// <summary>
    /// Full name of the schema used to issue the credential.
    /// </summary>
    public string SchemaName { get; set; } = null!;

    public string SchemaType { get; set; } = null!;

    public ArtifactType ArtifactType { get; set; }

    public string TenantIdIssuer { get; set; } = null!;

    public string TenantIdHolder { get; set; } = null!;

    public Dictionary<string, string> Attributes { get; set; } = null!;
  }
}
