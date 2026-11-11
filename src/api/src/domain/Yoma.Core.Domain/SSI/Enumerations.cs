using System.ComponentModel;

namespace Yoma.Core.Domain.SSI
{
  public enum ArtifactType
  {
    JWS,
    [Description("AnonCreds")]
    ACR,
    [Description("SD-JWT")]
    SDJWT
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

  public enum CredentialStatus
  {
    /// <summary>
    /// The provider could not establish the credential's current lifecycle status.
    /// Do not treat this as confirmation that the credential is unrevoked.
    /// </summary>
    Unknown,

    /// <summary>
    /// The provider reports the credential as issued and not revoked, or it is non-revocable.
    /// This does not replace expiry, signature or proof verification.
    /// </summary>
    Issued,

    /// <summary>
    /// The provider confirms credential revocation.
    /// Its wallet copy remains visible with this status until deletion succeeds.
    /// </summary>
    Revoked
  }

  public enum CredentialVerificationStatus
  {
    /// <summary>
    /// Verification has not established a result, including when the credential's status is unknown.
    /// This is not a failed verification.
    /// </summary>
    Unknown,

    /// <summary>
    /// Positive verification presentation result. Temporarily assumed for issued credentials
    /// until actual verification is integrated; not evidence of a completed cryptographic check.
    /// </summary>
    Verified,

    /// <summary>
    /// The credential cannot pass verification, including confirmed revocation.
    /// </summary>
    Invalid
  }

  public enum CredentialIssuanceStatus
  {
    Pending,
    Issued,
    Error,
    /// <summary>
    /// Same-provider credential cleanup scheduled by migration. Tenants/connections are preserved;
    /// only confirmed cleanup can release the schedule to Pending for normal issuance.
    /// </summary>
    Replay,
    Revoke,
    Revoked,
    Deleted,
    Reissue
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
