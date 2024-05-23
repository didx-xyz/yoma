using Yoma.Core.Domain.Core;

namespace Yoma.Core.Domain.Lookups.Helpers
{
  public static class TimeIntervalHelper
  {
    public static int GetOrder(string intervalAsString)
    {
      if (Enum.TryParse<TimeInterval>(intervalAsString, out var interval))
      {
        return interval switch
        {
          TimeInterval.Minute => 1,
          TimeInterval.Hour => 2,
          TimeInterval.Day => 3,
          TimeInterval.Week => 4,
          TimeInterval.Month => 5,
          _ => throw new InvalidOperationException($"{nameof(TimeInterval)} of '{interval}' not supported"),
        };
      }
      throw new InvalidOperationException($"Invalid TimeInterval name '{intervalAsString}'");
    }
  }
}
