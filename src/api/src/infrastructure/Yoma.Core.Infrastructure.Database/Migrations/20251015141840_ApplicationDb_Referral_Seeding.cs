using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_Referral_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Referral
      #region Lookups
      migrationBuilder.InsertData(
        table: "LinkStatus",
        columns: ["Id", "Name", "DateCreated"],
        values: new object?[,]
        {
          {"D71B9DEE-1320-45BE-89C9-5A6297BB0869","Active",DateTimeOffset.UtcNow}
          ,
          {"2061B074-7091-484C-9464-EF2FD125688E","Cancelled",DateTimeOffset.UtcNow}
          ,
          {"E00F4531-3BE2-47D0-8DF4-147E430AE129","LimitReached",DateTimeOffset.UtcNow}
          ,
          {"DDFB15B3-8EEF-48A5-B314-173FC911D7D2","Expired",DateTimeOffset.UtcNow}
        },
        schema: "Referral");

      migrationBuilder.InsertData(
       table: "LinkUsageStatus",
       columns: ["Id", "Name", "DateCreated"],
       values: new object?[,]
       {
          {"5AB91387-691F-4809-8D5A-D093C3A2639D","Pending",DateTimeOffset.UtcNow}
          ,
          {"E80DD95B-8C35-4F3F-9463-88C376C17ECD","Completed",DateTimeOffset.UtcNow}
          ,
          {"C2524F2C-A93D-440A-842B-F57FD2AAA9F1","Expired",DateTimeOffset.UtcNow}
       },
       schema: "Referral");

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
