namespace Yoma.Core.Domain.Referral.Models
{
  /// <summary>
  /// Aggregate analytics for a single referral program.
  /// Exposed via a dedicated admin endpoint and used on the Admin Program Info page.
  /// </summary>
  public sealed class ReferralAnalyticsProgram
  {
    /// <summary>
    /// Number of distinct users who created a referral link for the program.
    /// </summary>
    public int ReferrerCount { get; set; }

    /// <summary>
    /// Total number of referral links created for the program.
    /// </summary>
    public int LinkCount { get; set; }

    /// <summary>
    /// Total number of active referral links for the program.
    /// </summary>
    public int LinkCountActive { get; set; }

    /// <summary>
    /// Total number of referee usages / claims for the program.
    /// </summary>
    public int UsageCountTotal => UsageCountCompleted + UsageCountPending + UsageCountExpired;

    /// <summary>
    /// Total number of completed referee usages / claims.
    /// </summary>
    public int UsageCountCompleted { get; set; }

    /// <summary>
    /// Total number of pending referee usages / claims.
    /// </summary>
    public int UsageCountPending { get; set; }

    /// <summary>
    /// Total number of expired referee usages / claims.
    /// </summary>
    public int UsageCountExpired { get; set; }

    /// <summary>
    /// Percentage of claims that completed successfully.
    /// Returns 0 when there are no claims.
    /// </summary>
    public decimal ConversionRatioCompletionPercentage =>
      UsageCountTotal == 0
        ? default
        : Math.Round((decimal)UsageCountCompleted / UsageCountTotal * 100, 2);

    /// <summary>
    /// Average number of links created per referrer.
    /// </summary>
    public decimal LinkAveragePerReferrer =>
      ReferrerCount == 0
        ? default
        : Math.Round((decimal)LinkCount / ReferrerCount, 2);

    /// <summary>
    /// Average number of completed usages / claims generated per referrer.
    /// </summary>
    public decimal CompletedUsageAveragePerReferrer =>
      ReferrerCount == 0
        ? default
        : Math.Round((decimal)UsageCountCompleted / ReferrerCount, 2);
  }
}
