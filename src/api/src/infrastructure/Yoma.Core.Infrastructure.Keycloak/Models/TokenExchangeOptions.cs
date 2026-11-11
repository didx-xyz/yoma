namespace Yoma.Core.Infrastructure.Keycloak.Models
{
  /// <summary>
  /// Yoma-owned assertion client. Uses the existing Keycloak URL and realm. Covers authenticated
  /// token exchange and authorized background assertion acquisition; credentials stay in this adapter.
  /// </summary>
  public class TokenExchangeOptions
  {
    /// <summary>
    /// Confidential client provisioned through Yoma's realm import with the downstream audience.
    /// Authenticated exchange and background authorization use the same client.
    /// </summary>
    public string ClientId { get; set; } = null!;

    /// <summary>
    /// Secret of the Yoma assertion client, supplied privately per environment.
    /// This is neither a participant password nor a downstream provider client secret.
    /// </summary>
    public string ClientSecret { get; set; } = null!;

    /// <summary>
    /// Exact registered callback for background authorization with PKCE. The backend reads
    /// the code from the redirect without following it; no browser or callback endpoint is used.
    /// </summary>
    public string RedirectUri { get; set; } = null!;

    /// <summary>
    /// Per-request timeout in seconds, including temporary-session cleanup. Must be positive.
    /// </summary>
    public int RequestTimeoutSeconds { get; set; } = 30;
  }
}
