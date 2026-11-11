namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  /// <summary>
  /// Internal issuance journal. Correlates the issuer operation with the native holder-wallet ID.
  /// The domain receives WalletCredentialId; this row ID is never signed or exposed as a credential ID.
  /// Offers, signed credentials and participant tokens are not persisted here.
  /// Wallet recovery can restore the domain without this row; missing issuer/session history is not reconstructed.
  /// </summary>
  public class IssuanceMapping
  {
    /// <summary>
    /// Internal journal key, independent of the domain schedule and both provider credential IDs.
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
    /// Issuer operation ID used to correlate the accepted-wallet webhook and resume an undelivered offer.
    /// </summary>
    public string? IssuanceId { get; set; }

    /// <summary>
    /// Issuer-side credential ID returned with the offer, retained for tracing; not the wallet ID.
    /// </summary>
    public string? IssuerCredentialId { get; set; }

    /// <summary>
    /// Native holder-wallet credential ID resolved from the accepted event or reference-based recovery.
    /// Returned to the domain for storage, wallet reads and Replay deletion.
    /// </summary>
    public string? WalletCredentialId { get; set; }

    /// <summary>
    /// Records a successful delivery response. Does not prove continued wallet presence or drive retries.
    /// </summary>
    public bool DeliveryCompleted { get; set; }

    /// <summary>
    /// Adapter progress; Delivering is uncertain until the wallet confirms acceptance or deletion.
    /// A late/duplicate event must never revive a Deleted attempt.
    /// </summary>
    public string Status { get; set; } = null!;

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
