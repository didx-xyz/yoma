namespace Yoma.Core.Infrastructure.IXO.YellowCard.Models
{
  public sealed class YellowCardOptions
  {
    public const string Section = "IXO:YellowCard";

    /// <summary>
    /// Base URL of the IXO hosted payout API.
    /// </summary>
    public string BaseUrl { get; set; } = null!;

    /// <summary>
    /// Public endpoint containing the provider's live payout-country availability.
    /// </summary>
    public string SupportedCountriesUrl { get; set; } = null!;

    /// <summary>
    /// OAuth2 client-credentials token path.
    /// </summary>
    public string AccessTokenPath { get; set; } = null!;

    /// <summary>
    /// Partner payout collection path. Status and session paths are relative to this path.
    /// </summary>
    public string PayoutsPath { get; set; } = null!;

    public int RequestTimeoutSeconds { get; set; }

    public string ClientId { get; set; } = null!;

    public string ClientSecret { get; set; } = null!;

    /// <summary>
    /// Shared HMAC secret used to authenticate webhook deliveries from IXO.
    /// </summary>
    public string WebhookSigningSecret { get; set; } = null!;

    /// <summary>
    /// Maximum permitted clock difference for a webhook delivery timestamp.
    /// </summary>
    public int WebhookTimestampToleranceInMinutes { get; set; }
  }
}
