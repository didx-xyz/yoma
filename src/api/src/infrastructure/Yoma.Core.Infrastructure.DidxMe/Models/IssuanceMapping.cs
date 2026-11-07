namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  /// <summary>
  /// Correlates Yoma's single domain credential ID with the didx:me issuance, issuer credential and
  /// holder-wallet credential IDs, and records progress across their separate operations. Yoma's
  /// existing credential-ID column cannot represent all those identities without a domain change.
  /// Signed credentials, offers and participant tokens remain outside this store. Persisted intent
  /// does not prove remote presence/absence or solve the outstanding background recovery capability.
  /// </summary>
  public class IssuanceMapping
  {
    /// <summary>
    /// Stable correlation UUID signed as _Yoma_Credential_ID and returned as Credential.Id.
    /// The domain persists it in SSICredentialIssuance.CredentialId; it is neither external credential ID.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Configured didx:me tenant scope used to isolate mapping lookups.
    /// </summary>
    public string TenantAlias { get; set; } = null!;

    /// <summary>
    /// Links this issuance to its immutable domain schema and didx:me preset version.
    /// </summary>
    public string PresetMappingId { get; set; } = null!;

    /// <summary>
    /// Organisation name hash/referent retained as the domain's issuer compatibility reference. It is
    /// not a didx:me project ID: all credentials currently use the configured Yoma issuer.
    /// </summary>
    public string TenantIdIssuer { get; set; } = null!;

    /// <summary>
    /// Actual didx:me holder ID, matching SSI.TenantCreation.TenantId. The Yoma Keycloak
    /// subject is a federation external identifier and must not be stored as this wallet owner.
    /// </summary>
    public string TenantIdHolder { get; set; } = null!;

    /// <summary>
    /// Signed claim name carrying the originating Yoma item reference; checked during wallet reads.
    /// </summary>
    public string ClientReferentKey { get; set; } = null!;

    /// <summary>
    /// Originating Yoma item reference expected in that claim, distinct from the credential ID.
    /// </summary>
    public string ClientReferentValue { get; set; } = null!;

    /// <summary>
    /// Remote issuance-operation ID retained for tracing. Recording it does not implement recovery.
    /// </summary>
    public string? IssuanceId { get; set; }

    /// <summary>
    /// Issuer-side credential ID returned with the offer, retained for tracing; not the wallet ID.
    /// </summary>
    public string? IssuerCredentialId { get; set; }

    /// <summary>
    /// Holder-wallet credential ID learned during authenticated reads by matching the signed Yoma
    /// correlation. Initially null; once known, enables direct wallet retrieval by ID.
    /// </summary>
    public string? WalletCredentialId { get; set; }

    /// <summary>
    /// Records a successful delivery response. Does not prove continued wallet presence or drive retries.
    /// </summary>
    public bool DeliveryCompleted { get; set; }

    /// <summary>
    /// UTC time the local issuance intent was persisted, not the credential's signed issuance date.
    /// </summary>
    public DateTimeOffset DateCreated { get; set; }

    /// <summary>
    /// UTC time progress or a discovered wallet credential ID was last persisted.
    /// </summary>
    public DateTimeOffset DateModified { get; set; }
  }
}
