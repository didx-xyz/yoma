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
  }
}
