namespace Yoma.Core.Domain.SSI.Models.Provider
{
  public class CredentialIssuanceRequest
  {
    public KeyValuePair<string, string> ClientReferent { get; set; }

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
