using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static partial class ApplicationDb_Custom_Fields_Treasury_Payout_Seeding
  {
    internal static void SeedOpportunityTypeDisplayName(MigrationBuilder migrationBuilder)
    {
      #region Opportunity

      migrationBuilder.Sql("""
        UPDATE "Opportunity"."OpportunityType"
        SET "DisplayName" = "Name";
        """);

      #endregion Opportunity
    }
  }
}
