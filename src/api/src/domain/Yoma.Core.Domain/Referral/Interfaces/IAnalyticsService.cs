using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface IAnalyticsService
  {
    /// <summary>
    /// Returns my referral analytics (Authenticated User) for the specified participation role.
    /// Includes statistics for links (as referrer only), link usages / claims and rewards.
    /// </summary>
    ReferralAnalyticsUser ByUser(ReferralParticipationRole role);

    /// <summary>
    /// Searches system-wide referral analytics as the authenticated user.
    /// Returns obfuscated statistics per user for links (as referrer only), link usages / claims and rewards 
    /// based on the specified role (i.e. leaderboards).
    /// </summary>
    ReferralAnalyticsSearchResultsInfo Search(ReferralAnalyticsSearchFilter filter);

    /// <summary>
    /// Searches system-wide referral analytics as an admin (full detail).
    /// Returns statistics per user for links (as referrer), link usages / claims and rewards 
    /// with advanced filtering (i.e. leaderboards).
    /// </summary>
    ReferralAnalyticsSearchResults Search(ReferralAnalyticsSearchFilterAdmin filter);

  }
}
