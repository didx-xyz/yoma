using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <summary>
  /// Applies the agreed cash-out release settings to existing and newly seeded Treasuries.
  /// A zero payout pool blocks new payouts until funding is confirmed; financial history stays intact.
  /// </summary>
  public partial class ApplicationDb_Treasury_CashOut_Release_Defaults : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      #region Treasury - Cash-Out Release Defaults
      migrationBuilder.Sql("""
        UPDATE "Treasury"."Treasury"
        SET
          "PayoutPoolCurrentFinancialYearInUsd" = 0,
          "ConversionRateZltoUsd" = ROUND(1::numeric / 57, 10),
          "DateModified" = CURRENT_TIMESTAMP;
        """);
      #endregion
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      // Do not restore an unfunded pool or overwrite later administrator-approved settings on rollback.
      // These operational settings must be changed explicitly through Treasury management.
    }
  }
}
