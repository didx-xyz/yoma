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

    #region Claim Lifecycle

    /// <summary>
    /// Total number of referee usages / claims for the program.
    /// Includes only actual claims that reached the Pending lifecycle.
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

    #endregion

    #region Intent Lifecycle

    /// <summary>
    /// Total number of referral intents captured.
    /// Includes initiated, abandoned and actual claims.
    /// </summary>
    public int UsageCountIntentTotal =>
      UsageCountInitiated + UsageCountPending + UsageCountCompleted + UsageCountExpired + UsageCountAbandoned;

    /// <summary>
    /// Total number of initiated referee usages / claims.
    /// Represents referees who authenticated and showed intent to claim
    /// but have not yet completed onboarding.
    /// </summary>
    public int UsageCountInitiated { get; set; }

    /// <summary>
    /// Total number of abandoned referee usages / claims.
    /// Represents initiated intents that did not progress to a valid claim.
    /// </summary>
    public int UsageCountAbandoned { get; set; }

    /// <summary>
    /// Percentage of referral intents that converted into valid claims.
    /// Returns 0 when there are no captured intents.
    /// </summary>
    public decimal ConversionRatioIntentToClaimPercentage =>
      UsageCountIntentTotal == 0
        ? default
        : Math.Round((decimal)UsageCountTotal / UsageCountIntentTotal * 100, 2);

    /// <summary>
    /// Percentage of referral intents that ultimately completed successfully.
    /// Returns 0 when there are no captured intents.
    /// </summary>
    public decimal ConversionRatioIntentToCompletionPercentage =>
      UsageCountIntentTotal == 0
        ? default
        : Math.Round((decimal)UsageCountCompleted / UsageCountIntentTotal * 100, 2);

    #endregion

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
