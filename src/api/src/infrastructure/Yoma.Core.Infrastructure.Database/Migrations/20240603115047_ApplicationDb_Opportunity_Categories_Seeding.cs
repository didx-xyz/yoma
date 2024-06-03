using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_Opportunity_Categories_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Opportunity
      migrationBuilder.InsertData(
        table: "OpportunityCategory",
        columns: ["Id", "Name", "ImageURL", "DateCreated"],
        values: new object[,]
        {
          {"1DC39A5D-E049-4CFE-B708-855FCE97B86E","Data and Analytics","https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/DataAndAnalytics.svg",DateTimeOffset.UtcNow}
          ,
          {"7AFB66AD-164E-46A3-933F-A0BAC1CA1923","Arts and Creative Industry","https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/ArtsAndCreativeIndustry.svg",DateTimeOffset.UtcNow}
          ,
          {"B89C5E91-9CBB-4A0E-991F-F987EEBF9B70","Other","https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/Other.svg",DateTimeOffset.UtcNow}
        },
        schema: "Opportunity");
      #endregion Opportunity
    }
  }
}
