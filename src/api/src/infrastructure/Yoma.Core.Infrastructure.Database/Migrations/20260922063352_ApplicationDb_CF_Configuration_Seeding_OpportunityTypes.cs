using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class ApplicationDb_CF_Configuration_Seeding_OpportunityTypes
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Opportunity
      // Retain the existing ID referenced by opportunities.
      migrationBuilder.UpdateData(
        schema: "Opportunity",
        table: "OpportunityType",
        keyColumn: "Id",
        keyValue: "F12A9D90-A8F6-4914-8CA5-6ACF209F7312",
        columns: ["Name", "DisplayName"],
        values: ["ImpactAction", "Impact Action"]);

      migrationBuilder.InsertData(
        schema: "Opportunity",
        table: "OpportunityType",
        columns: ["Id", "Name", "DisplayName", "DateCreated"],
        values: new object[]
        {
          new Guid("d74da423-7779-4f49-9d6b-92ce5f61f4a1"), Domain.Opportunity.Type.Entrepreneurship.ToString(), "Entrepreneurship",
          DateTimeOffset.UtcNow
        });
      #endregion Opportunity
    }
  }
}
