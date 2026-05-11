namespace Yoma.Core.Infrastructure.Jobberman.Models
{
  /// <summary>
  /// Jobberman synchronization configuration.
  /// OrganizationIdYoma values reflect environment-specific Yoma organization Ids.
  /// Local and development values are seeded; staging and production values are managed by administrators and configured per environment.
  /// </summary>
  public sealed class JobbermanOptions
  {
    public const string Section = "Jobberman";

    /// <summary>
    /// Base URL for the Jobberman feed source.
    /// Feed-specific URL suffixes are appended to this value.
    /// </summary>
    public string BaseUrl { get; set; } = null!;

    /// <summary>
    /// Cron expression used to schedule Jobberman feed refreshes.
    /// </summary>
    public string PollSchedule { get; init; } = null!;

    /// <summary>
    /// HTTP request timeout, in seconds, when retrieving Jobberman feeds.
    /// </summary>
    public int RequestTimeoutSeconds { get; init; }

    /// <summary>
    /// Number of days to retain locally soft-deleted Jobberman opportunities before physical deletion.
    /// Use -1 to retain deleted rows indefinitely.
    /// </summary>
    public int RetentionDays { get; init; }

    /// <summary>
    /// Indicates whether ETag and Last-Modified conditional request headers should be sent.
    /// Disabled by default because each successful refresh must process the full feed snapshot to detect removed items.
    /// </summary>
    public bool UseConditionalRequests { get; init; }

    /// <summary>
    /// Optional User-Agent header value to send when retrieving Jobberman feeds.
    /// </summary>
    public string? UserAgent { get; init; }

    /// <summary>
    /// Default Yoma organization Id that synced opportunities should be mapped to.
    /// Feed-level values take precedence when specified.
    /// </summary>
    public Guid? OrganizationIdYoma { get; set; }

    /// <summary>
    /// Configured Jobberman country feeds.
    /// </summary>
    public List<JobbermanFeedOptions> Feeds { get; set; } = null!;
  }

  /// <summary>
  /// Jobberman country feed configuration.
  /// Feed-level OrganizationIdYoma supports mapping each country feed to a different Yoma organization.
  /// </summary>
  public sealed class JobbermanFeedOptions
  {
    /// <summary>
    /// Country feed identifier, e.g. NG or GH.
    /// </summary>
    public string CountryCodeAlpha2 { get; set; } = null!;

    /// <summary>
    /// Feed-specific URL suffix appended to the configured base URL.
    /// </summary>
    public string UrlSuffix { get; set; } = null!;

    /// <summary>
    /// Local .NET embedded resource name used when external partner synchronization is disabled.
    /// </summary>
    public string EmbeddedResourceName { get; set; } = null!;

    /// <summary>
    /// Yoma organization Id that synced opportunities from this country feed should be mapped to.
    /// Overrides the top-level default when specified.
    /// </summary>
    public Guid? OrganizationIdYoma { get; set; }
  }
}
