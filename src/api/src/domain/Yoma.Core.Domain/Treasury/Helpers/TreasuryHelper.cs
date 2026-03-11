namespace Yoma.Core.Domain.Treasury.Helpers
{
  public static class TreasuryHelper
  {
    /// <summary>
    /// Determines the financial year start date based on the newly configured start month/day,
    /// and decides whether the current financial year cumulatives must roll over.
    ///
    /// Rollover only occurs when:
    ///   • the newly configured financial year start date moves forward compared to the previously stored one, and
    ///   • the new start date is still in the future (after today)
    ///
    /// In all other cases the current financial year cumulatives are preserved.
    /// </summary>
    public static (DateOnly financialYearStartDate, bool requiresRollover) EvaluateFinancialYear(
      int newStartMonth,
      int newStartDay,
      DateOnly currentFinancialYearStartDate)
    {
      if (newStartMonth < DateTime.MinValue.Month || newStartMonth > DateTime.MaxValue.Month)
        throw new ArgumentOutOfRangeException(nameof(newStartMonth));

      // Use a fixed leap-safe reference year (2000) so February 29 remains a valid configuration value regardless of the current year.
      var maxDay = DateTime.DaysInMonth(2000, newStartMonth);

      if (newStartDay < DateTime.MinValue.Day || newStartDay > maxDay)
        throw new ArgumentOutOfRangeException(nameof(newStartDay));

      if (currentFinancialYearStartDate == default)
        throw new ArgumentException("Current financial year start date must be initialized.", nameof(currentFinancialYearStartDate));

      var today = DateOnly.FromDateTime(DateTime.UtcNow);

      // Adjust day safely for the current year (handles Feb 29 on non-leap years)
      var safeDay = Math.Min(newStartDay, DateTime.DaysInMonth(today.Year, newStartMonth));

      var candidate = new DateOnly(today.Year, newStartMonth, safeDay);

      var newFinancialYearStart =
        candidate >= today
        ? candidate
        : candidate.AddYears(-1);

      var requiresRollover =
        newFinancialYearStart > currentFinancialYearStartDate &&
        newFinancialYearStart > today;

      return (newFinancialYearStart, requiresRollover);
    }
  }
}
