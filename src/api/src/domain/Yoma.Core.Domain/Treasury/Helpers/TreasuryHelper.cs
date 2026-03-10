namespace Yoma.Core.Domain.Treasury.Helpers
{
  public static class TreasuryHelper
  {
    public static (DateOnly financialYearStartDate, bool requiresRotation) EvaluateFinancialYear(
      int startMonth,
      int startDay,
      DateOnly currentFinancialYearStartDate)
    {
      if (startMonth < DateTime.MinValue.Month || startMonth > DateTime.MaxValue.Month)
        throw new ArgumentOutOfRangeException(nameof(startMonth));

      var maxDay = DateTime.DaysInMonth(DateTime.UtcNow.Year, startMonth);

      if (startDay < DateTime.MinValue.Day || startDay > maxDay)
        throw new ArgumentOutOfRangeException(nameof(startDay));

      if (currentFinancialYearStartDate == default)
        throw new ArgumentException("Current financial year start date must be initialized.", nameof(currentFinancialYearStartDate));

      var today = DateOnly.FromDateTime(DateTime.UtcNow);

      var expectedStart = new DateOnly(today.Year, startMonth, startDay);

      if (today < expectedStart)
        expectedStart = expectedStart.AddYears(-1);

      return (expectedStart, expectedStart != currentFinancialYearStartDate);
    }
  }
}
