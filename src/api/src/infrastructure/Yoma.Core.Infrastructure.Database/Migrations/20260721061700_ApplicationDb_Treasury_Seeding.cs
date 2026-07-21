using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class ApplicationDb_Treasury_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Treasury - Refresh ZLTO Cumulative Totals
      migrationBuilder.Sql("""
        UPDATE "Treasury"."Treasury" treasury
        SET
          "ZltoRewardCumulative" = NULLIF(totals.total, 0),
          "ZltoRewardCumulativeCurrentFinancialYear" = NULLIF(totals.total, 0)
        FROM
        (
          SELECT
            COALESCE((SELECT SUM("ZltoRewardCumulative") FROM "Entity"."Organization"), 0) +
            COALESCE((SELECT SUM("ZltoRewardCumulative") FROM "Referral"."Program"), 0) AS total
        ) totals;
      """);
      #endregion
    }
  }
}
