namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  /// <summary>
  /// Federated Wallet Lite client provisioned in didx:me by DIDx/SRE, together with trust in
  /// Yoma's issuer/JWKS, identity-provider link, tenant claim and wallet audience mapper.
  /// One application client serves linked participants; the assertion subject identifies the
  /// holder. The JWT bearer grant returns a participant access token, not a refresh token or
  /// permission for arbitrary unattended holder access. Background recovery/Replay remains open.
  /// Holder tokens are encrypted in Yoma's distributed cache, bound to the exact incoming Yoma
  /// token, mapped holder and provider configuration, never beyond the earliest token expiry.
  /// Reuses the host's shared Data Protection key ring; no separate encryption secret or mode.
  /// </summary>
  public class HolderOptions
  {
    /// <summary>
    /// didx:me realm containing the federated Lite client and participant identities (locally
    /// consumers), appended to ProviderOptions.KeycloakBaseUri for the JWT bearer grant.
    /// </summary>
    public string Realm { get; set; } = null!;

    /// <summary>
    /// Federated Lite application client allocated in didx:me (locally yoma-federated-lite).
    /// This is shared across participants, not the consumer user ID or a per-participant secret.
    /// </summary>
    public string ClientId { get; set; } = null!;

    /// <summary>
    /// Secret for the didx:me federated Lite client, supplied through the environment secret store.
    /// Used with the Yoma assertion during the JWT grant; never logged or committed with Local settings.
    /// </summary>
    public string ClientSecret { get; set; } = null!;

    /// <summary>
    /// Exact canonical issuer URL from the didx:me consumers realm discovery document. Configure
    /// this same value in Yoma's assertion-client audience mapper. The Yoma assertion must have
    /// this sole audience; the resulting holder token must have this issuer and the me-wallet-api
    /// audience. Do not substitute a local transport URL or a client ID for this value.
    /// </summary>
    public string AssertionAudience { get; set; } = null!;
  }
}
