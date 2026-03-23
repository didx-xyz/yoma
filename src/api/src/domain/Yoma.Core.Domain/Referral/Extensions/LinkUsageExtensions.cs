using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Extensions
{
  public static class LinkUsageExtensions
  {
    public static int GetHoursToComplete(this ReferralLinkUsageInfo usage)
    {
      ArgumentNullException.ThrowIfNull(usage, nameof(usage));

      if (usage.Status != ReferralLinkUsageStatus.Completed || !usage.DateCompleted.HasValue || !usage.DateClaimed.HasValue)
        throw new InvalidOperationException(
          $"Expected completed usage but link usage '{usage.Id}' is not completed or completion timestamps are missing");

      return (int)Math.Ceiling((usage.DateCompleted.Value - usage.DateClaimed.Value).TotalHours);
    }
  }
}
