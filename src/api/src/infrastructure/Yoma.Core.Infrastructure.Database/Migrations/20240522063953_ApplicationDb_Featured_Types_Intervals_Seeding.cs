using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Logging;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_Featured_Types_Intervals_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Lookups
      migrationBuilder.InsertData(
        table: "TimeInterval",
        columns: ["Id", "Name", "DateCreated"],
        values: new object[,]
        {
          {"C24BFE8B-A44F-4F62-BAF3-F0E6C93AE319","Minute",DateTimeOffset.UtcNow}
        },
        schema: "Lookup");
      #endregion Lookups

      #region Opportunity
      migrationBuilder.InsertData(
        table: "OpportunityType",
        columns: ["Id", "Name", "DateCreated"],
        values: new object[,]
        {
          {"E20DCCEB-59C3-46D0-AB0A-D321D8BC4C31","Event",DateTimeOffset.UtcNow}
          ,
          {"5D67758F-3F06-47C6-8B62-420B33126665","Other",DateTimeOffset.UtcNow}
        },
        schema: "Opportunity");

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
