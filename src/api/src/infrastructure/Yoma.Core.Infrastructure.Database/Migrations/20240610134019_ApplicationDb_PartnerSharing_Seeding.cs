using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_PartnerSharing_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region PartnerSharing
      #region Lookups
      migrationBuilder.InsertData(
      table: "Partner",
      columns: ["Id", "Name", "Active", "ActionStatus", "DateCreated"],
      values: new object?[,]
      {
        {"F6F24538-825F-4BA8-BC0C-5C9BBA7ECF91","SAYouth",true,null,DateTimeOffset.UtcNow}
      },
      schema: "PartnerSharing");

      migrationBuilder.InsertData(
      table: "Status",
      columns: ["Id", "Name", "DateCreated"],
      values: new object?[,]
      {
        {"39CB481A-4E3A-4420-BC5A-338588784B57","Pending",DateTimeOffset.UtcNow}
        ,
        {"28F66FF0-A8C0-41BB-AB51-3519F82765FB","Processed",DateTimeOffset.UtcNow}
        ,
        {"461E8E60-B745-4A41-8625-C884F0AF2653","Error",DateTimeOffset.UtcNow}
        ,
        {"7C05B558-4F1F-49D4-99C2-B8841E35EBF1","Aborted",DateTimeOffset.UtcNow}
      },
      schema: "PartnerSharing");
      #endregion Lookups
      #endregion PartnerSharing
    }
  }
}
