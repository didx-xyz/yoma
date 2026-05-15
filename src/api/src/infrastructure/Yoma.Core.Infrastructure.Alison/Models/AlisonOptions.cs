namespace Yoma.Core.Infrastructure.Alison.Models
{
  /// <summary>
  /// Alison synchronization configuration.
  /// Uses a single global course catalogue, so synced opportunities are available world-wide.
  /// V2 authentication currently uses ClientId and ClientSecret only.
  /// Organization details are retained for reference/traceability against the Alison onboarding details.
  /// OrganizationIdYoma reflects the environment-specific Yoma organization Id.
  /// </summary>
  public sealed class AlisonOptions
  {
    public const string Section = "Alison";

    /// <summary>
    /// Base URL for the Alison v2 external API.
    /// API paths are appended to this value.
    /// </summary>
    public string BaseUrl { get; set; } = null!;

    /// <summary>
    /// API path used to request an access token.
    /// </summary>
    public string AccessTokenPath { get; set; } = null!;

    /// <summary>
    /// API path used to retrieve Alison courses.
    /// </summary>
    public string CoursesPath { get; set; } = null!;

    /// <summary>
    /// Cron expression used to schedule Alison course catalogue refreshes.
    /// Should run before the PartnerSync pull schedule so the main pull uses the latest cached catalogue.
    /// </summary>
    public string PollSchedule { get; init; } = null!;

    /// <summary>
    /// Maximum expected interval, in hours, for a single Alison course catalogue refresh.
    /// Used for the distributed lock duration.
    /// </summary>
    public int PollScheduleMaxIntervalInHours { get; init; }

    /// <summary>
    /// HTTP request timeout, in seconds, when retrieving Alison API data.
    /// Alison responses can be slow, so keep this configurable.
    /// </summary>
    public int RequestTimeoutSeconds { get; init; }

    /// <summary>
    /// Number of days to retain locally soft-deleted Alison courses before physical deletion.
    /// Use -1 to retain deleted rows indefinitely.
    /// </summary>
    public int RetentionDays { get; init; }

    /// <summary>
    /// Local .NET embedded resource name used when external partner synchronization is disabled.
    /// </summary>
    public string EmbeddedResourceName { get; set; } = null!;

    /// <summary>
    /// Alison API client Id used for v2 authentication.
    /// </summary>
    public string ClientId { get; set; } = null!;

    /// <summary>
    /// Alison API client secret used for v2 authentication.
    /// </summary>
    public string ClientSecret { get; set; } = null!;

    /// <summary>
    /// Alison organization name retained for reference/traceability.
    /// Not currently used by the v2 access-token request.
    /// </summary>
    public string OrganizationName { get; set; } = null!;

    /// <summary>
    /// Alison organization Id retained for reference/traceability.
    /// Not currently used by the v2 access-token request.
    /// </summary>
    public string OrganizationId { get; set; } = null!;

    /// <summary>
    /// Alison organization key retained for reference/traceability.
    /// Not currently used by the v2 access-token request.
    /// </summary>
    public string OrganizationKey { get; set; } = null!;

    /// <summary>
    /// Yoma organization Id that synced opportunities should be mapped to.
    /// Seeded on local and development; managed by administrators on staging and production.
    /// </summary>
    public Guid OrganizationIdYoma { get; set; }
  }
}
