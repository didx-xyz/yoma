namespace Yoma.Core.Domain.Treasury.Helpers
{
  public static class TreasuryHelper
  {
    /// <summary>
    /// Determines the financial year start date based on the newly configured start month/day,
    /// and decides whether the current financial year cumulatives must roll over.
    /// Rollover occurs when the calculated start of the current financial year moves
    /// forward compared to the persisted financial year start date.
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

      var candidateDay = Math.Min(newStartDay, DateTime.DaysInMonth(today.Year, newStartMonth));
      var candidate = new DateOnly(today.Year, newStartMonth, candidateDay);

      // Clamp the configured day against the selected financial-year year. Subtracting a year from
      // an already-clamped date would incorrectly turn a configured 29 February 2024 into 28 February.
      var financialYearStartYear = candidate <= today ? today.Year : today.Year - 1;
      var financialYearStartDay = Math.Min(newStartDay, DateTime.DaysInMonth(financialYearStartYear, newStartMonth));
      var newFinancialYearStart = new DateOnly(financialYearStartYear, newStartMonth, financialYearStartDay);

      var requiresRollover = newFinancialYearStart > currentFinancialYearStartDate;

      return (newFinancialYearStart, requiresRollover);
    }
  }
}
