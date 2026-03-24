using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class Referral_Usage_IntentLifeCycle_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Referral
      #region Lookups
      migrationBuilder.InsertData(
        table: "LinkUsageStatus",
        schema: "Referral",
        columns: ["Id", "Name", "DateCreated"],
        values: new object?[,]
        {
        { "7F2A6F3E-5A2C-4E6E-B3F4-2F4C5B9F6C01", "Initiated", DateTimeOffset.UtcNow },
        { "B3A1C3D4-2A7E-4F89-A3B6-9D8F2C5A7E11", "Abandoned", DateTimeOffset.UtcNow }
        });
      #endregion Lookups

      #region Data
      migrationBuilder.Sql("""
        UPDATE "Referral"."LinkUsage"
        SET "DateClaimed" = "DateCreated"
        WHERE "DateClaimed" IS NULL;
        """);
      #endregion Data
      #endregion Referral
    }
  }
}
