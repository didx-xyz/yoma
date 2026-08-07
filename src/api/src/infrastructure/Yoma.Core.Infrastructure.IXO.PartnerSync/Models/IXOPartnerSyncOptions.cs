namespace Yoma.Core.Infrastructure.IXO.PartnerSync.Models
{
  /// <summary>
  /// IXO partner synchronization configuration.
  /// </summary>
  public sealed class IXOPartnerSyncOptions
  {
    public const string Section = "IXO:PartnerSync";

    /// <summary>
    /// Base URL for the IXO partner API.
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
    /// API path used to register or authenticate a user and obtain an auto-login token.
    /// </summary>
    public string UserAccessPath { get; set; } = null!;

    /// <summary>
    /// API path used to retrieve opportunity verification records.
    /// </summary>
    public string VerificationsPath { get; set; } = null!;

    /// <summary>
    /// Cron expression used to refresh the local IXO partner sync opportunity catalogue cache.
    /// This should run before Yoma's partner opportunity pull schedule.
    /// </summary>
    public string PollSchedule { get; set; } = null!;

    /// <summary>
    /// Maximum expected duration, in hours, of a complete IXO catalogue refresh.
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
    /// Environment-specific Yoma organization that owns imported IXO opportunities.
    /// </summary>
    public Guid OrganizationIdYoma { get; set; }

    /// <summary>
    /// Display name retained on mapped opportunities.
    /// </summary>
    public string OrganizationName { get; set; } = "IXO";
  }
}
