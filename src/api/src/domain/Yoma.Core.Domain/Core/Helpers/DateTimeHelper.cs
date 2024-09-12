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

    public static DateTimeOffset? GetLatestValidDate(string dateOne, string dateTwo)
    {
      var isDateOneValid = DateTimeOffset.TryParse(dateOne, out DateTimeOffset dateOneParsed);
      var isDateTwoValid = DateTimeOffset.TryParse(dateTwo, out DateTimeOffset dateTwoParsed);

      if (!isDateOneValid && !isDateTwoValid)
        return null;

      if (!isDateOneValid)
        return dateTwoParsed;

      if (!isDateTwoValid)
        return dateOneParsed;

      return dateOneParsed >= dateTwoParsed ? dateOneParsed : dateTwoParsed;
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

      return age -1;
    }
  }
}
