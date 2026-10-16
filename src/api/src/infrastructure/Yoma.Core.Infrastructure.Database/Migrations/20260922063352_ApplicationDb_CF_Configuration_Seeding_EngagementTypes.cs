using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class ApplicationDb_CF_Configuration_Seeding_EngagementTypes
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Lookups
      // Rename the two existing rows in place so all Opportunity associations retain their IDs.
      migrationBuilder.UpdateData(
        schema: "Lookup",
        table: "EngagementType",
        keyColumn: "Id",
        keyValue: "0B2AAF7A-FDCF-4015-9668-D06BDEBAFA09",
        columns: ["Name", "DisplayName"],
        values: ["Remote", "Remote"]);

      migrationBuilder.UpdateData(
        schema: "Lookup",
        table: "EngagementType",
        keyColumn: "Id",
        keyValue: "171A5E0A-B4DB-49F1-A03E-96B5975650A7",
        columns: ["Name", "DisplayName"],
        values: ["OnSite", "On-site"]);

      migrationBuilder.UpdateData(
        schema: "Lookup",
        table: "EngagementType",
        keyColumn: "Id",
        keyValue: "6C0405A9-87B6-4834-9068-A928CEECF85B",
        column: "DisplayName",
        value: "Hybrid");
      #endregion Lookups
    }
  }
}
