using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class Opportunity_Category_Type_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Opportunity

      migrationBuilder.InsertData(
          table: "OpportunityCategory",
          columns: ["Id", "Name", "ImageURL", "DateCreated"],
          values: new object[,]
          {
            { "6E6A5F23-6D2E-4F45-8B4D-5D9C9A6B1E71", "Health and Care", "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/HealthAndCare.svg", DateTimeOffset.UtcNow }
          },
          schema: "Opportunity");

      migrationBuilder.InsertData(
          table: "OpportunityType",
          columns: ["Id", "Name", "DateCreated"],
          values: new object[,]
          {
            { "9C2D1A8E-3A4B-4F7A-9E2D-7F1C6B8A2D55", "Job", DateTimeOffset.UtcNow }
          },
          schema: "Opportunity");

      #endregion
    }
  }
}
