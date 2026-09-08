namespace Yoma.Core.Infrastructure.Umuzi.Models
{
  /// <summary>
  /// Configuration for phase-one catalogue and verification sync plus correlation redirects.
  /// Learner account provisioning and automatic sign-in are deferred to a separately agreed
  /// phase-two API contract; the access-token settings below authenticate the server only.
  /// </summary>
  public sealed class UmuziOptions
  {
    public const string Section = "Umuzi";

    /// <summary>
    /// Base URL for the Umuzi partner API.
    /// </summary>
    public string BaseUrl { get; set; } = null!;

    /// <summary>
    /// API path used to request a client-credentials access token.
    /// </summary>
    public string AccessTokenPath { get; set; } = null!;

    /// <summary>
    /// API path used to retrieve the complete opportunity catalogue.
    /// </summary>
    public string OpportunitiesPath { get; set; } = null!;

    /// <summary>
    /// Query parameter used for the agreed phase-one correlation-only redirect.
    /// This conveys a Yoma user id, not an authentication token or proof of identity.
    /// </summary>
    public string UserIdQueryParameter { get; set; } = "yomaUserId";

    /// <summary>
    /// API path used to retrieve opportunity verification records.
    /// </summary>
    public string VerificationsPath { get; set; } = null!;

    /// <summary>
    /// Cron expression used to refresh the local Umuzi partner sync opportunity catalogue cache.
    /// This should run before Yoma's partner opportunity pull schedule.
    /// </summary>
    public string PollSchedule { get; set; } = null!;

    /// <summary>
    /// Maximum expected duration, in hours, of a complete Umuzi catalogue refresh.
    /// </summary>
    public int PollScheduleMaxIntervalInHours { get; set; }

    /// <summary>
    /// HTTP request timeout in seconds.
    /// </summary>
    public int RequestTimeoutSeconds { get; set; }

    /// <summary>
    /// Number of days to retain terminally deleted local catalogue cache records.
    /// Shared partner-sync processing history continues to enforce terminal deletion after cache cleanup.
    /// </summary>
    public int RetentionDays { get; set; }

    /// <summary>
    /// Embedded opportunity catalogue used when external partner synchronization is disabled.
    /// </summary>
    public string OpportunitiesEmbeddedResourceName { get; set; } = null!;

    /// <summary>
    /// Embedded verification page used when external partner synchronization is disabled.
    /// </summary>
    public string VerificationsEmbeddedResourceName { get; set; } = null!;

    public string ClientId { get; set; } = null!;

    public string ClientSecret { get; set; } = null!;

    /// <summary>
    /// Environment-specific Yoma organization that owns imported Umuzi opportunities.
    /// </summary>
    public Guid OrganizationIdYoma { get; set; }

    /// <summary>
    /// Display name retained on mapped opportunities.
    /// </summary>
    public string OrganizationName { get; set; } = "Umuzi";
  }
}
