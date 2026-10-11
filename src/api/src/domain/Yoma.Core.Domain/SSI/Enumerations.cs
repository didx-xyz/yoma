using System.ComponentModel;

namespace Yoma.Core.Domain.SSI
{
  public enum ArtifactType
  {
    JWS,
    [Description("AnonCreds")]
    ACR
  }

  public enum Role
  {
    Holder,
    Issuer,
    Verifier
  }

  public enum SchemaType
  {
    Opportunity,
    YoID
  }

  public enum TenantCreationStatus
  {
    Pending,
    Created,
    Error
  }

  public enum CredentialIssuanceStatus
  {
    Pending,
    Issued,
    Error
  }

  public enum SchemaEntityPropertySystemType
  {
    Issuer,
    IssuerLogoURL,
    Title,
    OpportunityType
  }

  /// <summary>
  /// Fixed order of the shared credential body sections. Other configured groups remain
  /// supported and follow these sections alphabetically; this is not a signed claim.
  /// </summary>
  public enum SchemaPresentationGroup
  {
    [Description("Opportunity Details")]
    OpportunityDetails,
    [Description("Completion Details")]
    CompletionDetails
  }
}
