using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_Store_AccessControl_Rules_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Marketplace
      migrationBuilder.InsertData(
      table: "StoreAccessControlRuleStatus",
      columns: ["Id", "Name", "DateCreated"],
      values: new object[,]
      {
        {"C783B3FC-4E08-4502-95C9-385DAD824353","Active",DateTimeOffset.UtcNow}
        ,
        {"5870BEDD-40B7-4556-A537-120E59598BA8","Inactive",DateTimeOffset.UtcNow}
        ,
        {"9A535100-6251-4419-8049-B88F6195A78F","Deleted",DateTimeOffset.UtcNow}
      },
      schema: "Marketplace");
      #endregion Marketplace
    }
  }
}
