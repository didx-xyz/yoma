using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class ApplicationDb_CF_Configuration_Seeding_OpportunitySchemaAssignments
  {
    #region Public Members
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region SSI
      #region Opportunity Schema Assignments
      // Schema names are provider references, not database foreign keys. Move managed generic
      // assignments once in this migration; the existing startup job publishes the schemas later.
      // Preserve custom selections, disabled issuance and all queued/issued credential records.
      migrationBuilder.Sql($"""
        UPDATE "Opportunity"."Opportunity" AS O
        SET "SSISchemaName" = 'Opportunity|' || T."Name" || '|Default',
            "DateModified" = CURRENT_TIMESTAMP
        FROM "Opportunity"."OpportunityType" AS T
        WHERE O."TypeId" = T."Id"
          AND T."Name" IN (
            '{Domain.Opportunity.Type.ImpactAction}',
            '{Domain.Opportunity.Type.Event}',
            '{Domain.Opportunity.Type.Job}',
            '{Domain.Opportunity.Type.Entrepreneurship}'
          )
          AND O."CredentialIssuanceEnabled" = true
          AND lower(btrim(O."SSISchemaName")) = 'opportunity|default';
        """);
      #endregion Opportunity Schema Assignments
      #endregion SSI
    }
    #endregion Public Members
  }
}
