namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  /// <summary>
  /// Assertion acquisition on Yoma's own Keycloak, before federation into didx:me. Yoma's existing
  /// realm export/config import creates this confidential standard-exchange client with
  /// basic/profile/email scopes and a single consumers-issuer audience mapper. The Yoma web
  /// client includes its client ID as an access-token audience and basic scope supplies the subject.
  /// An authenticated participant token is required; service-account/browser/password grants are
  /// disabled on this assertion client. It does not provide background impersonation.
  /// </summary>
  public class TokenExchangeOptions
  {
    /// <summary>
    /// Reachable Yoma Keycloak root, including any deployment prefix but excluding /realms.
    /// This is separate from ProviderOptions.KeycloakBaseUri, which points to didx:me Keycloak.
    /// </summary>
    public string KeycloakBaseUri { get; set; } = null!;

    /// <summary>
    /// Yoma realm containing the participant and assertion client (locally yoma). Its signing
    /// issuer and reachable JWKS must match the trust configured separately in didx:me.
    /// </summary>
    public string Realm { get; set; } = null!;

    /// <summary>
    /// Client provisioned by Yoma's normal Keycloak import (yoma-didxme-assertion). The incoming
    /// Yoma access token must include this audience; its exchanged assertion instead targets
    /// Holder.AssertionAudience exclusively. No additional API/role audience scopes belong here.
    /// </summary>
    public string ClientId { get; set; } = null!;

    /// <summary>
    /// Must match CLIENT_DIDXME_ASSERTION_SECRET supplied to Yoma's Keycloak config import.
    /// Local Compose supplies a fixed development default; deployed values come from SRE's
    /// secret injection. This is a Yoma-owned secret, not either didx:me client secret.
    /// </summary>
    public string ClientSecret { get; set; } = null!;
  }
}
