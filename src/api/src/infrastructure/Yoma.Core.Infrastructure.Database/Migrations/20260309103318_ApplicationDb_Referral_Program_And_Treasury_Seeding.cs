using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class Referral_Program_And_Treasury_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Organization - Seed Current Financial Year Cumulative
      migrationBuilder.Sql("""
        UPDATE "Entity"."Organization"
        SET
          "ZltoRewardCumulativeCurrentFinancialYear" = "ZltoRewardCumulative",
          "YomaRewardCumulativeCurrentFinancialYear" = "YomaRewardCumulative";
      """);
      #endregion

      #region Referral Program - Seed Referrer Totals
      migrationBuilder.Sql("""
        UPDATE "Referral"."Program" p
        SET "ReferrerTotal" = src."ReferrerTotal"
        FROM (
          SELECT
            l."ProgramId",
            NULLIF(COUNT(DISTINCT l."UserId"),0) AS "ReferrerTotal"
          FROM "Referral"."Link" l
          GROUP BY l."ProgramId"
        ) src
        WHERE p."Id" = src."ProgramId";
      """);
      #endregion

      #region Treasury - Initial Record
      migrationBuilder.Sql("""
        INSERT INTO "Treasury"."Treasury"
        (
          "Id",
          "FinancialYearStartMonth",
          "FinancialYearStartDay",
          "ZltoRewardPoolCurrentFinancialYear",
          "ZltoRewardCumulative",
          "ZltoRewardCumulativeCurrentFinancialYear",
          "ChimoneyPoolCurrentFinancialYearInUSD",
          "ChimoneyCumulativeInUSD",
          "ChimoneyCumulativeCurrentFinancialYearInUSD",
          "ConversionRateZltoUsd",
          "DateCreated",
          "CreatedByUserId",
          "DateModified",
          "ModifiedByUserId"
        )
        SELECT
          '20F15B5E-92B5-4A5B-BC2E-90BAEBBE8047',
          3,
          1,
          NULL,
          NULLIF((org_total + ref_total),0),
          NULLIF((org_total + ref_total),0),
          NULL,
          NULL,
          NULL,
          0.01,
          NOW(),
          '8929632E-2911-42FF-9A44-055DEF231B87',
          NOW(),
          '8929632E-2911-42FF-9A44-055DEF231B87'
        FROM
        (
          SELECT
            (SELECT SUM("ZltoRewardCumulative") FROM "Entity"."Organization") AS org_total,
            (SELECT SUM("ZltoRewardCumulative") FROM "Referral"."Program") AS ref_total
        ) totals
        WHERE NOT EXISTS (
          SELECT 1 FROM "Treasury"."Treasury"
        );
      """);
      #endregion
    }
  }
}
