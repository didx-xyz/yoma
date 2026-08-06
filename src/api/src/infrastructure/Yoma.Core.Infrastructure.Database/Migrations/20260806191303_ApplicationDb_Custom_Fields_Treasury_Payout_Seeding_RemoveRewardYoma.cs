using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static partial class ApplicationDb_Custom_Fields_Treasury_Payout_Seeding
  {
    internal static void SeedRemoveRewardYoma(MigrationBuilder migrationBuilder)
    {
      #region SSI - Schema Entity Property
      migrationBuilder.DeleteData(
        table: "SchemaEntityProperty",
        keyColumn: "Id",
        keyValue: new Guid("35632B44-19A1-4763-A92B-22E72B1BA4A3"),
        schema: "SSI");
      #endregion SSI - Schema Entity Property
    }

    internal static void UnseedRemoveRewardYoma(MigrationBuilder migrationBuilder)
    {
      #region SSI - Schema Entity Property
      migrationBuilder.InsertData(
        table: "SchemaEntityProperty",
        columns: ["Id", "SSISchemaEntityId", "Name", "NameDisplay", "Description", "Required", "SystemType", "Format", "DateCreated"],
        values:
        [
          new Guid("35632B44-19A1-4763-A92B-22E72B1BA4A3"),
          new Guid("CA11D9D0-39F6-46D8-A0D3-350EC41402F5"),
          "YomaReward", "Yoma Reward", "Yoma Reward", false, null, "Y0.00", DateTimeOffset.UtcNow
        ],
        schema: "SSI");
      #endregion SSI - Schema Entity Property
    }
  }
}
