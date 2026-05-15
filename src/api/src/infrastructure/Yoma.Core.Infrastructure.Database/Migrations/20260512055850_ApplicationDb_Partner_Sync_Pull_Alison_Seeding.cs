using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_Partner_Sync_Pull_Alison_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region PartnerSync
      #region Lookups
      migrationBuilder.UpdateData(
        schema: "PartnerSync",
        table: "Partner",
        keyColumn: "Id",
        keyValue: new Guid("8A8A5A8E-2B0A-4E2D-9A62-5C4C1F7E2D33"),
        column: "Active",
        value: true);
      #endregion Lookups
      #endregion PartnerSync
    }
  }
}
