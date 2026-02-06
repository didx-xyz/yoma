using System.Globalization;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class DateTimeHelper
  {
    public static DateTimeOffset? TryParse(string? value)
    {
      if (string.IsNullOrWhiteSpace(value)) return null;
      value = value.Trim();

      if (!DateTimeOffset.TryParse(value, out var result) || result == default) return null;

      return result;
    }

    public static DateTimeOffset Min(DateTimeOffset value1, DateTimeOffset value2) => value1 <= value2 ? value1 : value2;

    public static DateTimeOffset Max(DateTimeOffset value1, DateTimeOffset value2) => value1 >= value2 ? value1 : value2;

    public static DateTimeOffset? Min(DateTimeOffset? value1, DateTimeOffset? value2)
    {
      if (value1 == null && value2 == null) return null;
      if (value1 == null) return value2;
      if (value2 == null) return value1;

      return value1 <= value2 ? value1 : value2;
    }

    public static DateTimeOffset? Max(DateTimeOffset? value1, DateTimeOffset? value2)
    {
      if (value1 == null && value2 == null) return null;
      if (value1 == null) return value2;
      if (value2 == null) return value1;

      return value1 >= value2 ? value1 : value2;
    }

    public static DateTimeOffset? Min(string value1, string value2)
    {
      var value1Valid = DateTimeOffset.TryParse(value1, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var value1Parsed);
      var value2Valid = DateTimeOffset.TryParse(value2, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var value2Parsed);

      if (!value1Valid && !value2Valid) return null;
      if (!value1Valid) return value2Parsed;
      if (!value2Valid) return value1Parsed;

      return value1Parsed <= value2Parsed ? value1Parsed : value2Parsed;
    }

    public static DateTimeOffset? Max(string value1, string value2)
    {
      var value1Valid = DateTimeOffset.TryParse(value1, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var value1Parsed);
      var value2Valid = DateTimeOffset.TryParse(value2, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var value2Parsed);

      if (!value1Valid && !value2Valid) return null;
      if (!value1Valid) return value2Parsed;
      if (!value2Valid) return value1Parsed;

      return value1Parsed >= value2Parsed ? value1Parsed : value2Parsed;
    }

    public static int CalculateAge(this DateTimeOffset dateOfBirth, DateTimeOffset? currentDate)
    {
      var effectiveCurrentDate = currentDate ?? DateTimeOffset.UtcNow;

      if (dateOfBirth == default)
        throw new ArgumentNullException(nameof(dateOfBirth));

      if (dateOfBirth > effectiveCurrentDate)
        throw new ArgumentException("Value in the future", nameof(dateOfBirth));

      var age = effectiveCurrentDate.Year - dateOfBirth.Year;

      if (effectiveCurrentDate.Month > dateOfBirth.Month ||
       (effectiveCurrentDate.Month == dateOfBirth.Month && effectiveCurrentDate.Day >= dateOfBirth.Day)) return age;

      return age - 1;
    }
  }
}
