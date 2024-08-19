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

      if (!Enum.TryParse<TimeIntervalOption>(intervalName, true, out var interval))
        throw new ArgumentOutOfRangeException(nameof(intervalName), $"'{intervalName}' is not supported");

      var minutes = interval switch
      {
        TimeIntervalOption.Minute => count,
        TimeIntervalOption.Hour => (long)count * 60,
        TimeIntervalOption.Day => (long)count * 60 * 24,
        TimeIntervalOption.Week => (long)count * 60 * 24 * 7,
        TimeIntervalOption.Month => (long)count * 60 * 24 * 30,
        _ => throw new InvalidOperationException($"{nameof(TimeIntervalOption)} of '{interval}' not supported"),
      };

      return minutes;
    }

    public static int GetOrder(string intervalAsString)
    {
      if (Enum.TryParse<TimeIntervalOption>(intervalAsString, out var interval))
      {
        return interval switch
        {
          TimeIntervalOption.Minute => 1,
          TimeIntervalOption.Hour => 2,
          TimeIntervalOption.Day => 3,
          TimeIntervalOption.Week => 4,
          TimeIntervalOption.Month => 5,
          _ => throw new InvalidOperationException($"{nameof(TimeIntervalOption)} of '{interval}' not supported"),
        };
      }
      throw new InvalidOperationException($"Invalid TimeInterval name '{intervalAsString}'");
    }
  }
}
