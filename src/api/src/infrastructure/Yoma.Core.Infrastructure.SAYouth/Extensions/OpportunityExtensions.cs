using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Infrastructure.SAYouth.Models;

namespace Yoma.Core.Infrastructure.SAYouth.Extensions
{
  public static class OpportunityExtensions
  {
    public static Duration? ToDuration(this Opportunity opportunity)
    {
      int totalHours = opportunity.TimeIntervalToHours();

      return totalHours switch
      {
        <= 168 => Duration.OneWeek, // 1 week = 168 hours
        <= 720 => Duration.OneMonth, // 1 month = 720 hours (assuming 30 days)
        <= 2160 => Duration.ThreeMonths, // 3 months = 2160 hours
        <= 4320 => Duration.ThreeToSixMonths, // 6 months = 4320 hours
        <= 8760 => Duration.SixToTwelveMonths, // 12 months = 8760 hours
        <= 13140 => Duration.EighteenMonths, // 18 months = 13140 hours
        <= 17520 => Duration.TwentyFourMonths, // 24 months = 17520 hours
        _ => null
      };
    }
  }
}
