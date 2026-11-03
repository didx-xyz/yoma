using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.SSI;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <summary>
  /// Resets existing SSI schedules for the one-off move to didx:me. Retains issuance dates,
  /// client referents and YoID schema names; moves opportunity schedules to current seeded defaults.
  /// Leaves Aries storage and remote credentials intact.
  /// Stop and drain SSI workers before applying. This is provider cutover, not Replay cleanup.
  /// </summary>
  internal static class ApplicationDb_SSI_DidxMe_Seeding_ProviderReset
  {
    public static void Seed(MigrationBuilder migrationBuilder)
    {
      #region SSI
      // Resolve both lookups before changing rows; missing configuration must fail the migration.
      // Fresh databases have no schedules yet. EF migration history prevents resetting them again.
      // This cutover deliberately replaces opportunity schema choices, including custom names.
      // Issuance resolves the latest version after seeding and waits for the required tenants.
      migrationBuilder.Sql($"""
        DO $$
        DECLARE
          tenant_pending_id uuid;
          issuance_pending_id uuid;
        BEGIN
          SELECT "Id" INTO STRICT tenant_pending_id
          FROM "SSI"."TenantCreationStatus"
          WHERE "Name" = '{TenantCreationStatus.Pending}';

          SELECT "Id" INTO STRICT issuance_pending_id
          FROM "SSI"."CredentialIssuanceStatus"
          WHERE "Name" = '{CredentialIssuanceStatus.Pending}';

          -- Match the seeded defaults: Learning/Other use the generic claim set.
          -- Update every opportunity schedule, including previously issued credentials being reset.
          UPDATE "SSI"."CredentialIssuance" AS issuance
          SET "SchemaName" = CASE
            WHEN opportunity_type."Name" IN (
              '{Domain.Opportunity.Type.ImpactAction}',
              '{Domain.Opportunity.Type.Event}',
              '{Domain.Opportunity.Type.Job}',
              '{Domain.Opportunity.Type.Entrepreneurship}'
            ) THEN 'Opportunity|' || opportunity_type."Name" || '|Default'
            ELSE 'Opportunity|Default'
          END
          FROM "Opportunity"."MyOpportunity" AS completion
          JOIN "Opportunity"."Opportunity" AS opportunity ON opportunity."Id" = completion."OpportunityId"
          JOIN "Opportunity"."OpportunityType" AS opportunity_type ON opportunity_type."Id" = opportunity."TypeId"
          WHERE issuance."MyOpportunityId" = completion."Id"
            AND issuance."SchemaTypeId" = (
              SELECT "Id" FROM "SSI"."SchemaType" WHERE "Name" = '{SchemaType.Opportunity}'
            );

          UPDATE "SSI"."TenantCreation"
          SET "StatusId" = tenant_pending_id,
              "TenantId" = NULL,
              "ErrorReason" = NULL,
              "RetryCount" = NULL,
              "DateModified" = CURRENT_TIMESTAMP;

          -- Preserve dates; only legacy Issued rows without one use their old DateModified.
          -- Genuinely unissued work receives its date during issuance.
          UPDATE "SSI"."CredentialIssuance" AS issuance
          SET "ArtifactType" = '{ArtifactType.SDJWT}',
              "SchemaVersion" = NULL,
              "StatusId" = issuance_pending_id,
              "CredentialId" = NULL,
              "DateIssued" = COALESCE(issuance."DateIssued",
                CASE WHEN status."Name" = '{CredentialIssuanceStatus.Issued}' THEN issuance."DateModified" END),
              "ErrorReason" = NULL,
              "RetryCount" = NULL,
              "DateModified" = CURRENT_TIMESTAMP
          FROM "SSI"."CredentialIssuanceStatus" AS status
          WHERE status."Id" = issuance."StatusId";
        END $$;
        """);
      #endregion SSI
    }
  }
}
