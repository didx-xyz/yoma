using Yoma.Core.Domain.Analytics.Services;
using Yoma.Core.Domain.SSI;

namespace Yoma.Core.Domain.Analytics.Models
{
  /// <summary>
  /// Raw counts are populated by the service layer
  /// The semantic meaning depends on the derived model:
  /// • Public model: exposes active / published values (except 'UserCount' which remains total registered users)
  ///   and applies rounding in the derived overrides for public reporting
  /// • Admin model: exposes raw / total values
  /// </summary>
  public abstract class PlatformMetricsBase
  {
    /// <summary>
    /// Raw total registered users
    /// Public: total registered users, rounded for display
    /// Admin: raw total registered users
    /// </summary>
    public virtual int UserCount { get; set; }

    /// <summary>
    /// Raw organization count
    /// Public: active organizations, rounded for display
    /// Admin: raw total organizations (excluding declined)
    /// </summary>
    public virtual int OrganizationCount { get; set; }

    /// <summary>
    /// Raw country count
    /// Public: countries with active organizations (not rounded)
    /// Admin: raw total countries represented by organizations
    /// </summary>
    public virtual int CountryCount { get; set; }

    /// <summary>
    /// Raw opportunity count
    /// Public: published opportunities available to youth (active opportunities from active organizations), rounded for display
    /// Admin: raw total opportunities irrespective of status
    /// </summary>
    public virtual int OpportunityCount { get; set; }

    /// <summary>
    /// Credential counts by schema type
    /// Public: rounded and presented in compact form.
    /// Admin: raw counts
    /// </summary>
    public List<CredentialMetricsBase> CredentialSummary { get; set; } = null!;
  }

  public sealed class PlatformMetrics : PlatformMetricsBase
  {
    #region Public Members
    /// <summary>
    /// Rounded DOWN to the nearest 100,000 and formatted with thousands separators and a "+" suffix (e.g., "900,000+")
    /// </summary>
    public string UserCountDisplay => UserCount < AnalyticsService.RoundingFactor_PlatformMetrics_UserCount ? $"{UserCount:N0}" : $"{UserCount:N0}+";

    /// <summary>
    /// Rounded DOWN to the nearest 10 and formatted with thousands separators only (e.g., "70") — no "+" suffix
    /// </summary>
    public string OrganizationCountDisplay => $"{OrganizationCount:N0}";

    /// <summary>
    /// Not rounded. Formatted with thousands separators only (e.g., "21") — no rounding and no "+" suffix
    /// </summary>
    public string CountryCountDisplay => $"{CountryCount:N0}";

    /// <summary>
    /// Rounded DOWN to the nearest 10 and formatted with thousands separators only (e.g., "380") — no "+" suffix
    /// </summary>
    public string OpportunityCountDisplay => $"{OpportunityCount:N0}";

    /// <summary>
    /// Credential counts by schema type
    /// </summary>
    public new List<CredentialMetrics> CredentialSummary { get; set; } = null!;
    #endregion
  }

  public sealed class PlatformMetricsAdmin : PlatformMetricsBase
  {
    /// <summary>
    /// Users actively using Yoma V3 (YoID onboarded)
    /// </summary>
    public int UserCountActive { get; set; }

    /// <summary>
    /// Active organizations
    /// </summary>
    public int OrganizationCountActive { get; set; }

    /// <summary>
    /// Countries with active organizations
    /// </summary>
    public int OrganizationCountryCountActive { get; set; }

    /// <summary>
    /// Published opportunities available to youth (active opportunities from active organizations)
    /// </summary>
    public int OpportunityCountPublished { get; set; }

    /// <summary>
    /// Credential counts by schema type
    /// </summary>
    public new List<CredentialMetricsAdmin> CredentialSummary { get; set; } = null!;
  }

  public abstract class CredentialMetricsBase
  {
    public SchemaType Type { get; set; }

    /// <summary>
    /// Credential count (actual for admin; rounded-down source value for public)
    /// </summary>
    public int Count { get; set; }
  }

  public sealed class CredentialMetrics : CredentialMetricsBase
  {
    /// <summary>
    /// Rounded DOWN to the nearest 1,000 and compact "k" display (e.g., "255k")
    /// </summary>
    public string CountDisplay => Count < AnalyticsService.RoundingFactor_PlatformMetrics_CredentialCount ?
      $"{Count:N0}" : $"{Count / AnalyticsService.RoundingFactor_PlatformMetrics_CredentialCount}k";
  }

  public sealed class CredentialMetricsAdmin : CredentialMetricsBase { }
}
