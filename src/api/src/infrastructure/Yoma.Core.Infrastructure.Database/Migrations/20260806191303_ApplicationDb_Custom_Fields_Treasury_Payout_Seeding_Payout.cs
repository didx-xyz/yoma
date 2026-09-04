using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static partial class ApplicationDb_Custom_Fields_Treasury_Payout_Seeding
  {
    internal static void SeedPayout(MigrationBuilder migrationBuilder)
    {
      #region Payout - Transaction Statuses
      migrationBuilder.InsertData(
        table: "TransactionStatus",
        columns: ["Id", "Name", "DateCreated"],
        values: new object[,]
        {
          { "308DC2B1-CE0C-4DE2-8204-0FDCCDE2BCE6", "Initiated", DateTimeOffset.UtcNow },
          { "8B765E9D-4DA2-4557-934C-7E5E3C64F8CC", "Processing", DateTimeOffset.UtcNow },
          { "35F10CE5-1818-47C4-93A4-0B74A528EDDC", "Completed", DateTimeOffset.UtcNow },
          { "02D392A6-D902-454B-BFA1-11449ED6EA48", "Failed", DateTimeOffset.UtcNow },
          { "F2FBB07B-4719-4DA8-8997-4C75F26B61CF", "Cancelled", DateTimeOffset.UtcNow },
          { "52121C60-F8DA-4F2E-B060-E6B414B48AA6", "Expired", DateTimeOffset.UtcNow },
          { "6E709175-711A-4A83-9735-87CD918FA177", "ReconciliationRequired", DateTimeOffset.UtcNow }
        },
        schema: "Payout");
      #endregion Payout - Transaction Statuses

      #region Reward - Transaction Statuses
      migrationBuilder.InsertData(
        table: "TransactionStatus",
        columns: ["Id", "Name", "DateCreated"],
        values: new object[,]
        {
          { "8B2B1D44-9A19-4398-93E8-82AA61BA2911", "Reserved", DateTimeOffset.UtcNow },
          { "2F39338E-079D-4966-9352-AF273444A8FC", "Released", DateTimeOffset.UtcNow }
        },
        schema: "Reward");
      #endregion Reward - Transaction Statuses
    }

    internal static void UnseedPayout(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DeleteData(
        table: "TransactionStatus",
        keyColumn: "Id",
        keyValues:
        [
          new Guid("8B2B1D44-9A19-4398-93E8-82AA61BA2911"),
          new Guid("2F39338E-079D-4966-9352-AF273444A8FC")
        ],
        schema: "Reward");
    }
  }
}
