namespace Yoma.Core.Infrastructure.JobJack.Models
{
  /// <summary>
  /// JobJack opportunity synchronization configuration.
  /// OrganizationIdYoma values reflect environment-specific Yoma organization Ids.
  /// </summary>
  public sealed class JobJackOptions
  {
    public const string Section = "JobJack";

    /// <summary>
    /// Full URL of the JobJack opportunity snapshot feed.
    /// </summary>
    public string FeedUrl { get; set; } = null!;

    /// <summary>
    /// Cron expression used to schedule JobJack feed refreshes.
    /// </summary>
    public string PollSchedule { get; init; } = null!;

    /// <summary>
    /// HTTP request timeout, in seconds, when retrieving the JobJack feed.
    /// </summary>
    public int RequestTimeoutSeconds { get; init; }

    /// <summary>
    /// Number of days to retain locally soft-deleted JobJack opportunities before physical deletion.
    /// Use -1 to retain deleted rows indefinitely.
    /// </summary>
    public int RetentionDays { get; init; }

    /// <summary>
    /// Indicates whether ETag and Last-Modified conditional request headers should be sent.
    /// Disabled by default because each successful refresh must process the full snapshot to detect removed items.
    /// </summary>
    public bool UseConditionalRequests { get; init; }

    /// <summary>
    /// Optional User-Agent header value to send when retrieving the JobJack feed.
    /// </summary>
    public string? UserAgent { get; init; }

    /// <summary>
    /// Local .NET embedded resource name used when external partner synchronization is disabled.
    /// </summary>
    public string EmbeddedResourceName { get; set; } = null!;

    /// <summary>
    /// Yoma organization Id that synced JobJack opportunities should be mapped to.
    /// </summary>
    public Guid? OrganizationIdYoma { get; set; }
  }
}
