using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_ActionLink_Approval_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region ActionLink
      migrationBuilder.InsertData(
      table: "Status",
      columns: ["Id", "Name", "DateCreated"],
      values: new object[,]
      {
        {"00E03280-666A-4EAD-9F23-A883FA0D1186","Declined",DateTimeOffset.UtcNow}
        ,
        {"53AC01D5-6D8F-4186-B584-89085AB90D5A","Deleted",DateTimeOffset.UtcNow}
      },
      schema: "ActionLink");
      #endregion ActionLink
    }
  }
}
