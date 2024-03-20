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
  }
}
