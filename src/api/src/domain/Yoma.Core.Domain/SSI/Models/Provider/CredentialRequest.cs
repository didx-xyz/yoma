namespace Yoma.Core.Domain.SSI.Models.Provider
{
  public class CredentialIssuanceRequest
  {
    public KeyValuePair<string, string> ClientReferent { get; set; }

    public string SchemaName { get; set; }

    public string SchemaType { get; set; }

    public ArtifactType ArtifactType { get; set; }

    public string TenantIdIssuer { get; set; }

    public string TenantIdHolder { get; set; }

    public Dictionary<string, string> Attributes { get; set; }
  }
}
