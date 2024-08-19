using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Infrastructure.SAYouth.Models;

namespace Yoma.Core.Infrastructure.SAYouth.Extensions
{
  public static class OpportunityExtensions
  {
    public static Duration? ToDuration(this Opportunity opportunity)
    {
      int totalDays = opportunity.TimeIntervalToDays();

      return totalDays switch
      {
        <= 7 => Duration.OneWeek, // 1 week = 7 days
        <= 30 => Duration.OneMonth, // 1 month = 30 days
        <= 90 => Duration.ThreeMonths, // 3 months = 90 days
        <= 180 => Duration.ThreeToSixMonths, // 6 months = 180 days
        <= 365 => Duration.SixToTwelveMonths, // 12 months = 365 days
        <= 547 => Duration.EighteenMonths, // 18 months = 547 days
        <= 730 => Duration.TwentyFourMonths, // 24 months = 730 days
        _ => null
      };
    }
  }
}
