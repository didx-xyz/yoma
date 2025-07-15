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
    Title
  }
}
