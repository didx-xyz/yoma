using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_Partner_Sync_Verification_Progress_Seeding
  {
    internal static void SeedUp(MigrationBuilder migrationBuilder)
    {
      #region Opportunity

      migrationBuilder.UpdateData(
        schema: "Opportunity",
        table: "OpportunityType",
        keyColumn: "Id",
        keyValue: "F12A9D90-A8F6-4914-8CA5-6ACF209F7312",
        column: "Name",
        value: "Task");

      #endregion Opportunity
    }

    internal static void SeedDown(MigrationBuilder migrationBuilder)
    {
      #region Opportunity

      migrationBuilder.UpdateData(
        schema: "Opportunity",
        table: "OpportunityType",
        keyColumn: "Id",
        keyValue: "F12A9D90-A8F6-4914-8CA5-6ACF209F7312",
        column: "Name",
        value: "Micro-task");

      #endregion Opportunity
    }
  }
}

