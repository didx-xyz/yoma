using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_NavigatedExternalLink_EngagementType_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Lookups
      migrationBuilder.InsertData(
      table: "EngagementType",
      columns: ["Id", "Name", "DateCreated"],
      values: new object[,]
      {
        {"0B2AAF7A-FDCF-4015-9668-D06BDEBAFA09","Online",DateTimeOffset.UtcNow}
        ,
        {"171A5E0A-B4DB-49F1-A03E-96B5975650A7","Offline",DateTimeOffset.UtcNow}
        ,
        {"6C0405A9-87B6-4834-9068-A928CEECF85B","Hybrid",DateTimeOffset.UtcNow}
      },
      schema: "Lookup");
      #endregion Lookups

      #region Opportunity
      migrationBuilder.InsertData(
      table: "MyOpportunityAction",
      columns: ["Id", "Name", "DateCreated"],
      values: new object[,]
      {
        {"A9C0E90F-0193-4CBF-9FB4-E5A51C5C1FBC","NavigatedExternalLink",DateTimeOffset.UtcNow}
      },
      schema: "Opportunity");
      #endregion Opportunity
    }
  }
}
