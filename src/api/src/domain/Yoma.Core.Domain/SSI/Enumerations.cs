namespace Yoma.Core.Domain.SSI.Models
{
  public enum ArtifactType
  {
    Indy,
    LD_Proof,
    JWS
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
