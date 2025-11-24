using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface IAnalyticsService
  {
    /// <summary>
    /// Returns my referral analytics (authenticated user) for the specified role.
    /// Includes statistics for links (referrer role only), link usages / claims and rewards.
    /// </summary>
    ReferralAnalyticsUser ByUser(ReferralParticipationRole role);

    /// <summary>
    /// Searches system-wide referral analytics as the authenticated user.
    /// Returns obfuscated statistics per user for links (referrer role only),
    /// link usages / claims and rewards based on the specified role (leaderboards).
    /// </summary>
    ReferralAnalyticsSearchResultsInfo Search(ReferralAnalyticsSearchFilter filter);

    /// <summary>
    /// Searches system-wide referral analytics as an admin.
    /// Returns full statistics per user for links (referrer role only),
    /// link usages / claims and rewards with advanced filtering (leaderboards).
    /// </summary>
    ReferralAnalyticsSearchResults Search(ReferralAnalyticsSearchFilterAdmin filter);
  }
}
