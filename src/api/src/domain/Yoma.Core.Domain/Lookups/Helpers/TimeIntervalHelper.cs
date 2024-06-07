using Yoma.Core.Domain.Core;

namespace Yoma.Core.Domain.Lookups.Helpers
{
  public static class TimeIntervalHelper
  {
    public static long ConvertToMinutes(string intervalName, int count)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(intervalName, nameof(intervalName));
      intervalName = intervalName.Trim();

      if (count <= 0)
        throw new ArgumentOutOfRangeException(nameof(count), "Count must be greater than 0");

      if (!Enum.TryParse<TimeInterval>(intervalName, true, out var interval))
        throw new ArgumentOutOfRangeException(nameof(intervalName), $"'{intervalName}' is not supported");

      var minutes = interval switch
      {
        TimeInterval.Minute => count,
        TimeInterval.Hour => (long)count * 60,
        TimeInterval.Day => (long)count * 60 * 24,
        TimeInterval.Week => (long)count * 60 * 24 * 7,
        TimeInterval.Month => (long)count * 60 * 24 * 30,
        _ => throw new InvalidOperationException($"{nameof(TimeInterval)} of '{interval}' not supported"),
      };

      return minutes;
    }

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
