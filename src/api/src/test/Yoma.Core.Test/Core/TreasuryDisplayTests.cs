using Xunit;
using Yoma.Core.Domain.Treasury.Extensions;
using Yoma.Core.Domain.Treasury.Models;

namespace Yoma.Core.Test.Core
{
  public class TreasuryDisplayTests
  {
    #region Tests

    [Fact]
    public void ConversionRateDisplaysAs57AndZeroPoolIsNotUncapped()
    {
      var treasury = new Treasury
      {
        FinancialYearStartMonth = 3,
        FinancialYearStartDay = 1,
        PayoutPoolCurrentFinancialYearInUsd = 0m,
        ConversionRateZltoUsd = decimal.Round(1m / 57m, 10)
      };

      var info = treasury.ToInfo(0m);

      Assert.Equal(57m, info.ConversionRateZltoPerUsd);
      Assert.Equal(1m, decimal.Round(57m * treasury.ConversionRateZltoUsd, 2));
      Assert.Equal(0m, info.PayoutBalanceAvailableCurrentFinancialYearInUsd);
      Assert.Equal((byte)3, info.FinancialYearStartMonth);
      Assert.Equal((byte)1, info.FinancialYearStartDay);
    }
    #endregion
  }
}
