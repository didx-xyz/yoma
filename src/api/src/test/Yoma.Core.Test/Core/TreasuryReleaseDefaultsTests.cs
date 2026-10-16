using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Xunit;
using Yoma.Core.Domain.Treasury.Extensions;
using Yoma.Core.Domain.Treasury.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Migrations;

namespace Yoma.Core.Test.Core
{
  public class TreasuryReleaseDefaultsTests
  {
    #region Tests
    [Fact]
    public void MigrationIsDiscoveredAfterTheExistingTreasurySeed()
    {
      var options = new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql("Host=localhost;Database=unused;Username=unused;Password=unused",
          options => options.UseNetTopologySuite())
        .Options;
      using var context = new ApplicationDbContext(options);

      // Metadata discovery only; no database connection is opened.
      Assert.Equal("20261015090000_ApplicationDb_Treasury_CashOut_Release_Defaults", context.Database.GetMigrations().Last());
    }

    [Fact]
    public void MigrationChangesOnlyTheReleaseSettingsAndModificationDate()
    {
      var migration = new ApplicationDb_Treasury_CashOut_Release_Defaults();
      var operation = Assert.IsType<SqlOperation>(Assert.Single(migration.UpOperations));

      Assert.Equal("""
        UPDATE "Treasury"."Treasury"
        SET
          "PayoutPoolCurrentFinancialYearInUsd" = 0,
          "ConversionRateZltoUsd" = ROUND(1::numeric / 57, 10),
          "DateModified" = CURRENT_TIMESTAMP;
        """, operation.Sql);
      Assert.False(operation.SuppressTransaction);
      Assert.Empty(migration.DownOperations);
    }

    [Fact]
    public void SeededRateDisplaysAs57AndZeroPoolIsNotUncapped()
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
