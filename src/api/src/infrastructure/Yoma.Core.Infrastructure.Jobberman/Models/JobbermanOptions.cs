namespace Yoma.Core.Infrastructure.Jobberman.Models
{
  public sealed class JobbermanOptions
  {
    public const string Section = "Jobberman";

    /// <summary>
    /// Base URL for the Jobberman feed source.
    /// Feed-specific URL suffixes are appended to this value.
    /// </summary>
    public string BaseUrl { get; set; } = null!;

    /// <summary>
    /// Cron expression used to schedule the Jobberman feed refresh job.
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
    /// Indicates whether ETag and Last-Modified conditional request headers should be used.
    /// Disabled by default because the feed is currently treated as a complete snapshot, and each successful refresh must process the full feed to detect removed items.
    /// </summary>
    public bool UseConditionalRequests { get; init; }

    /// <summary>
    /// Optional User-Agent header value to send when retrieving Jobberman feeds.
    /// Currently not required, but can be configured if Jobberman requires client identification in future.
    /// </summary>
    public string? UserAgent { get; init; }

    public List<JobbermanFeedOptions> Feeds { get; set; } = null!;
  }

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
    /// Yoma organization ID that opportunities from this country feed should be mapped to.
    /// </summary>
    public Guid OrganizationIdYoma { get; set; }
  }
}
