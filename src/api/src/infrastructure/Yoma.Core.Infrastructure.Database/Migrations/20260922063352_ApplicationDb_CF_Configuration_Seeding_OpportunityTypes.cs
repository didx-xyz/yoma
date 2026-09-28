using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class ApplicationDb_CF_Configuration_Seeding_OpportunityTypes
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      // Retain the existing ID referenced by opportunities.
      migrationBuilder.UpdateData(
        schema: "Opportunity",
        table: "OpportunityType",
        keyColumn: "Id",
        keyValue: "F12A9D90-A8F6-4914-8CA5-6ACF209F7312",
        columns: ["Name", "DisplayName"],
        values: ["ImpactAction", "Impact Action"]);
    }
  }
}
