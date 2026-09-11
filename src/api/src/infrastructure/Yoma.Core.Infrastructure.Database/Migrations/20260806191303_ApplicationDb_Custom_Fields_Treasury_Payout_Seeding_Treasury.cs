using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static partial class ApplicationDb_Custom_Fields_Treasury_Payout_Seeding
  {
    internal static void SeedTreasury(MigrationBuilder migrationBuilder)
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
