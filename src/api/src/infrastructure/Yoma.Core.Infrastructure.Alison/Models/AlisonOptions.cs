namespace Yoma.Core.Infrastructure.Alison.Models
{
  /// <summary>
  /// Alison synchronization configuration; uses a single global course catalogue, so synced opportunities are available world-wide.
  /// OrganizationIdYoma reflects the environment-specific Yoma organization Id.
  /// </summary>
  public sealed class AlisonOptions
  {
    public const string Section = "Alison";

    /// <summary>
    /// Base URL for the Alison API.
    /// API paths are appended to this value.
    /// </summary>
    public string BaseUrl { get; set; } = null!;

    /// <summary>
    /// API path used to request an access token.
    /// </summary>
    public string AccessTokenPath { get; set; } = null!;

    /// <summary>
    /// API path used to refresh an access token.
    /// </summary>
    public string RefreshTokenPath { get; set; } = null!;

    /// <summary>
    /// API path used to retrieve Alison courses.
    /// </summary>
    public string CoursesPath { get; set; } = null!;

    /// <summary>
    /// Alison API client Id.
    /// </summary>
    public string ClientId { get; set; } = null!;

    /// <summary>
    /// Alison API client secret.
    /// </summary>
    public string ClientSecret { get; set; } = null!;

    /// <summary>
    /// Alison organization name.
    /// </summary>
    public string OrganizationName { get; set; } = null!;

    /// <summary>
    /// Alison organization Id.
    /// </summary>
    public string OrganizationId { get; set; } = null!;

    /// <summary>
    /// Alison organization key.
    /// </summary>
    public string OrganizationKey { get; set; } = null!;

    /// <summary>
    /// Yoma organization Id that synced opportunities should be mapped to.
    /// Seeded on local and development; managed by administrators on staging and production.
    /// </summary>
    public Guid OrganizationIdYoma { get; set; }
  }
}
