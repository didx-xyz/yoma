using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <summary>
  /// Repairs historical participant counters alongside the CF completion/CSV transaction fixes.
  /// The code fixes prevent the reproduced rollback-tracking defect; they do not repair old data.
  /// </summary>
  public partial class ApplicationDb_Opportunity_ParticipantCount_Reconcile : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      // Run with completion/import writers paused. Keep both locks and the update in EF's
      // migration transaction. NOWAIT fails safely if a writer is active; retry in a quiet window.
      // Do not suppress the transaction or split this into independent commands/connections.
      migrationBuilder.Sql("""
        LOCK TABLE "Opportunity"."MyOpportunity" IN SHARE ROW EXCLUSIVE MODE NOWAIT;
        LOCK TABLE "Opportunity"."Opportunity" IN SHARE ROW EXCLUSIVE MODE NOWAIT;

        DO $guard$
        BEGIN
          IF (SELECT COUNT(*) FROM "Opportunity"."MyOpportunityAction" WHERE "Name" = 'Verification') <> 1
             OR (SELECT COUNT(*) FROM "Opportunity"."MyOpportunityVerificationStatus" WHERE "Name" = 'Completed') <> 1 THEN
            RAISE EXCEPTION 'Participant count reconciliation requires the Verification and Completed lookups';
          END IF;
        END $guard$;

        WITH completed AS (
          SELECT mo."OpportunityId", COUNT(*)::integer AS "ActualCount"
          FROM "Opportunity"."MyOpportunity" mo
          JOIN "Opportunity"."MyOpportunityAction" a ON a."Id" = mo."ActionId"
          JOIN "Opportunity"."MyOpportunityVerificationStatus" s ON s."Id" = mo."VerificationStatusId"
          WHERE a."Name" = 'Verification' AND s."Name" = 'Completed'
          GROUP BY mo."OpportunityId"
        ), corrections AS (
          SELECT o."Id", COALESCE(c."ActualCount", 0) AS "ActualCount"
          FROM "Opportunity"."Opportunity" o
          LEFT JOIN completed c ON c."OpportunityId" = o."Id"
          WHERE COALESCE(o."ParticipantCount", 0) <> COALESCE(c."ActualCount", 0)
        )
        UPDATE "Opportunity"."Opportunity" o
        SET "ParticipantCount" = c."ActualCount"
        FROM corrections c
        WHERE o."Id" = c."Id";
        """);
      // Reconciles overcounts as well as undercounts across all opportunities, irrespective
      // of status or import source. Existing null/zero counters with no completions stay as-is.
      // No reward totals, participant limits, timestamps, credentials or completion rows change.
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      // Intentionally irreversible: rollback must not restore incorrect historical counters.
    }
  }
}
