using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Extensions
{
  public static class LinkUsageExtensions
  {
    public static int GetHoursToComplete(this ReferralLinkUsageInfo usage)
    {
      ArgumentNullException.ThrowIfNull(usage, nameof(usage));

      if (usage.Status != ReferralLinkUsageStatus.Completed || !usage.DateCompleted.HasValue)
        throw new InvalidOperationException(
          $"Expected completed but link usage with {usage.Id} is not completed or date completed is not set");

      return (int)Math.Ceiling((usage.DateCompleted.Value - usage.DateClaimed).TotalHours);
    }
  }
}
