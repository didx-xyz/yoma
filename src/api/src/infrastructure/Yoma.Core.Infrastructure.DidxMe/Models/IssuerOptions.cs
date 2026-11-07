namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  /// <summary>
  /// Organisation authentication configured in didx:me by DIDx/SRE. Client-credentials tokens
  /// authorize Yoma's preset, onboarding, issuance and org-delivery operations without a user
  /// session. The current adapter uses one tenant/issuer project for YoID and opportunity
  /// credentials; the opportunity organisation is carried in claims, not a separate signing identity.
  /// Credential signing keys remain with the didx:me issuer provider, not in this client secret.
  /// Tokens are cached in memory independently per API container and refreshed before expiry;
  /// no distributed cache, persistent token storage or selectable caching mode is used.
  /// </summary>
  public class IssuerOptions
  {
    /// <summary>
    /// didx:me realm containing the organisation client (locally product-hub), appended to
    /// ProviderOptions.KeycloakBaseUri. This is not Yoma's login realm.
    /// </summary>
    public string Realm { get; set; } = null!;

    /// <summary>
    /// Organisation client allocated in didx:me (locally yoma-me-creds), with the Yoma tenant
    /// claim and required service audiences/permissions supplied during platform provisioning.
    /// </summary>
    public string ClientId { get; set; } = null!;

    /// <summary>
    /// Secret supplied for the didx:me organisation client. Obtain it through the approved
    /// environment secret store; keep Local values ignored and never log this options object.
    /// It is independent of the Holder and TokenExchange client secrets.
    /// </summary>
    public string ClientSecret { get; set; } = null!;
  }
}
