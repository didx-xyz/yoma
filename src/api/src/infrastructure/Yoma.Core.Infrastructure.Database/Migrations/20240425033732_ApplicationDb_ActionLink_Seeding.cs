using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_ActionLink_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region ActionLink
      migrationBuilder.InsertData(
      table: "Status",
      columns: ["Id", "Name", "DateCreated"],
      values: new object[,]
      {
        {"B33EE4F4-F810-4134-9FD8-3EC30EE61BD5","Active",DateTimeOffset.UtcNow}
        ,
        {"EF4D12CD-294D-43FE-9689-39B14D55E837","Inactive",DateTimeOffset.UtcNow}
        ,
        {"4FDA3E52-23DD-49B5-9F35-293B9DC9A3AC","Expired",DateTimeOffset.UtcNow}
        ,
        {"5414F827-013E-4877-8FF1-405B727A0482","LimitReached",DateTimeOffset.UtcNow}
      },
      schema: "ActionLink");
      #endregion ActionLink
    }
  }
}
