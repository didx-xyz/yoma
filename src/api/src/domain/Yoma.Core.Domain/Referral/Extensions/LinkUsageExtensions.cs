using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Extensions
{
  public static class LinkUsageExtensions
  {
    public static int GetHoursToComplete(this ReferralLinkUsageInfo usage)
    {
      ArgumentNullException.ThrowIfNull(usage, nameof(usage));

      if (usage.Status != ReferralLinkUsageStatus.Completed || !usage.Completed || !usage.DateCompleted.HasValue)
        throw new InvalidOperationException(
          $"ReferralLinkUsageInfo {usage.Id} is not completed or DateCompleted is missing.");

      return (int)Math.Ceiling((usage.DateCompleted.Value - usage.DateClaimed).TotalHours);
    }
  }
}
