using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_VerificationType_Video_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Opportunity
      migrationBuilder.InsertData(
      table: "OpportunityVerificationType",
      columns: ["Id", "Name", "DisplayName", "Description", "DateCreated"],
      values: new object[,]
      {
        {"401DD5A4-D1EB-4D1A-BC52-51D369C200A7","Video","Video","A video of you showcasing what you did",DateTimeOffset.UtcNow}
      },
      schema: "Opportunity");

      migrationBuilder.UpdateData(
        table: "OpportunityVerificationType",
        schema: "Opportunity",
        keyColumn: "Id",
        keyValue: Guid.Parse("AE4B5CA3-20CE-451A-944E-67EF24E455B6"),
        column: "Description",
        value: "A file of your completion certificate");
      #endregion Opportunity
    }
  }
}
