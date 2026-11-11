namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  /// <summary>
  /// Yoma's delivery endpoint signing secret and bounded inline wait. SRE registers the endpoint
  /// and supplies its secret privately per environment; the secret is never a participant token.
  /// </summary>
  public class WebhookOptions
  {
    /// <summary>
    /// Endpoint-specific signing secret supplied by the webhook service. Store through environment
    /// secret configuration, or ignored Local settings; never use an OAuth client secret here.
    /// </summary>
    public string SigningSecret { get; set; } = null!;

    /// <summary>
    /// Allowed difference between the signed request timestamp and this API instance's clock, in seconds.
    /// </summary>
    public int TimestampToleranceSeconds { get; set; } = 300;

    /// <summary>
    /// Maximum inline wait after wallet delivery for persisted acceptance correlation, in seconds.
    /// </summary>
    public int WaitTimeoutSeconds { get; set; } = 60;

    /// <summary>
    /// Interval for checking acceptance persisted by any API instance, in milliseconds.
    /// </summary>
    public int PollIntervalMilliseconds { get; set; } = 500;
  }
}
