using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_Referral_Admin_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Referral
      #region Lookups
      migrationBuilder.InsertData(
      table: "ProgramStatus",
      columns: ["Id", "Name", "DateCreated"],
      values: new object?[,]
      {
        {"E322B386-15EC-4C46-A65F-D9F9BC4BE21D","Active",DateTimeOffset.UtcNow}
        ,
        {"53B67BF9-2B3E-4601-A8A3-66D3F8261C1E","Inactive",DateTimeOffset.UtcNow}
        ,
        {"D6E34140-A511-4BF9-945C-81ECAB794BCF","Expired",DateTimeOffset.UtcNow}
        ,
        {"9E7282E1-A3CE-4F8C-9BC2-B9B44E3FAC6C","Deleted",DateTimeOffset.UtcNow}
      },
      schema: "Referral");
      #endregion Lookups
      #endregion Referral
    }
  }
}
