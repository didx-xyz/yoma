namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  /// <summary>
  /// Binds the DidxMe configuration section for one Yoma environment. DIDx/SRE provisions the
  /// didx:me tenant, issuer project, issuer client and federated Lite client. Yoma's normal
  /// identity-provider integration owns acquisition of Yoma assertions.
  /// Issuer operations use client credentials; wallet reads exchange an authenticated Yoma user's
  /// token through Yoma Keycloak and then didx:me Keycloak. These are separate authorization paths.
  /// </summary>
  /// <remarks>
  /// SRE supplies environment URLs, identifiers and secret references after once-off provisioning.
  /// Tracked API settings contain placeholders; ignored Local settings can contain real external
  /// credentials and must never be logged or committed. Fixed Docker development defaults apply
  /// only to the corresponding local Yoma clients, not to all secrets in Local settings.
  /// </remarks>
  public class ProviderOptions
  {
    public const string Section = "DidxMe";

    /// <summary>
    /// Timeout in seconds for each issuer-token, holder-token and wallet-read
    /// HTTP request. Must be positive; defaults to 30. Each federation leg has its own timeout.
    /// </summary>
    public int RequestTimeoutSeconds { get; set; } = 30;

    /// <summary>
    /// Timeout in seconds for issuer-side API operations, including presets, onboarding,
    /// issuance and delivery. Must be positive; defaults to 60 to allow for issuance processing.
    /// Token acquisition uses RequestTimeoutSeconds instead.
    /// </summary>
    public int IssuerRequestTimeoutSeconds { get; set; } = 60;

    /// <summary>
    /// Maximum early-expiry buffer in seconds for issuer tokens and both exchanged holder-flow
    /// tokens. Must be non-negative; defaults to 30. The effective buffer is capped at ten percent
    /// of expires_in so short-lived tokens remain usable. Zero disables early refresh, not expiry
    /// checks. Encrypted distributed holder reuse remains bounded by source, assertion and holder expiry.
    /// </summary>
    public int AccessTokenRefreshBufferSeconds { get; set; } = 30;

    /// <summary>
    /// Tenant alias allocated in didx:me for this Yoma environment (locally yoma). One platform
    /// tenant serves Yoma's organisations; their identity remains in credential claims. This is
    /// also the expected tenantAlias claim on federated holder tokens. It resolves the credentials
    /// project in didx:me; it is neither the domain's local organisation reference nor a holder ID.
    /// </summary>
    public string TenantAlias { get; set; } = null!;

    /// <summary>
    /// Reachable didx:me me-creds API root, including its API prefix but excluding v1.
    /// The adapter appends versioned preset and issuance paths and uses Issuer authentication.
    /// </summary>
    public string CredentialsBaseUri { get; set; } = null!;

    /// <summary>
    /// Reachable didx:me me-wallet API root, including its API prefix but excluding v2.
    /// Org delivery uses Issuer authentication; participant reads use federated Holder tokens.
    /// </summary>
    public string WalletBaseUri { get; set; } = null!;

    /// <summary>
    /// Reachable didx:me consumer-onboarding API root, including its API prefix. Used with Issuer
    /// authentication to create/resolve participants and link their Yoma Keycloak subject as the
    /// externalIdentifier. Participant onboarding is distinct from environment tenant provisioning.
    /// </summary>
    public string OnboardingBaseUri { get; set; } = null!;

    /// <summary>
    /// Reachable didx:me Keycloak root, including any deployment prefix such as /iam, but excluding
    /// /realms. Issuer and Holder realms are appended here. Yoma's Keycloak URL belongs separately
    /// in the identity-provider configuration; transport URLs need not equal the canonical issuer/audience URL.
    /// </summary>
    public string KeycloakBaseUri { get; set; } = null!;

    /// <summary>
    /// DIDx/SRE-provisioned organisation client used for presets, onboarding, issuance and delivery.
    /// Currently selects Yoma's single issuer tenant/project, not a client per Yoma organisation.
    /// </summary>
    public IssuerOptions Issuer { get; set; } = new();

    /// <summary>
    /// DIDx/SRE-provisioned federated Lite client accepting a signed Yoma assertion and returning
    /// a token for the linked participant's wallet. This shared application client is not an issuer.
    /// </summary>
    public HolderOptions Holder { get; set; } = new();

    public WebhookOptions Webhook { get; set; } = null!;
  }
}
