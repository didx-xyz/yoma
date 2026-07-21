using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Treasury : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.RenameColumn(
          name: "ChimoneyPoolCurrentFinancialYearInUSD",
          schema: "Treasury",
          table: "Treasury",
          newName: "CashOutPoolCurrentFinancialYearInUsd");

      migrationBuilder.RenameColumn(
          name: "ChimoneyCumulativeInUSD",
          schema: "Treasury",
          table: "Treasury",
          newName: "CashOutCumulativeInUsd");

      migrationBuilder.RenameColumn(
          name: "ChimoneyCumulativeCurrentFinancialYearInUSD",
          schema: "Treasury",
          table: "Treasury",
          newName: "CashOutCumulativeCurrentFinancialYearInUsd");

      ApplicationDb_Treasury_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.RenameColumn(
          name: "CashOutPoolCurrentFinancialYearInUsd",
          schema: "Treasury",
          table: "Treasury",
          newName: "ChimoneyPoolCurrentFinancialYearInUSD");

      migrationBuilder.RenameColumn(
          name: "CashOutCumulativeInUsd",
          schema: "Treasury",
          table: "Treasury",
          newName: "ChimoneyCumulativeInUSD");

      migrationBuilder.RenameColumn(
          name: "CashOutCumulativeCurrentFinancialYearInUsd",
          schema: "Treasury",
          table: "Treasury",
          newName: "ChimoneyCumulativeCurrentFinancialYearInUSD");
    }
  }
}
