using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Services;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <summary>
  /// Enables the capability only. Future Replay scheduling must follow the migration/cleanup runbook
  /// on <see cref="SSIBackgroundService"/>; this migration never marks credentials Replay.
  /// </summary>
  internal static class ApplicationDb_SSI_Credential_Replay_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region SSI - Credential Issuance
      migrationBuilder.InsertData(
        schema: "SSI",
        table: "CredentialIssuanceStatus",
        columns: ["Id", "Name", "DateCreated"],
        values: [new Guid("3b47387f-390c-42c4-b11f-902081d5096f"), CredentialIssuanceStatus.Replay.ToString(), DateTimeOffset.UtcNow]);

      // Deliberate legacy approximation agreed for existing Issued schedules. Snapshot it now:
      // subsequent Replay checkpoints/retries will change DateModified. Unissued rows remain null.
      migrationBuilder.Sql("""
        UPDATE "SSI"."CredentialIssuance" AS issuance
        SET "DateIssued" = issuance."DateModified"
        FROM "SSI"."CredentialIssuanceStatus" AS status
        WHERE status."Id" = issuance."StatusId"
          AND status."Name" = 'Issued'
          AND issuance."DateIssued" IS NULL;
        """);

      // Replay scheduling placeholder only - NOT executed in this capability migration:
      // 1. Pause/drain issuance workers before the deployment migration (including old pods).
      // 2. In a separate reviewed migration, set StatusId to the Replay lookup for the intended scope.
      // 3. Retain schedule IDs/client referents, CredentialId, SchemaName/Version, artifact/entity
      //    references and DateIssued. Do not reset tenant schedules, IDs, connections or schemas.
      // 4. Resume SSIBackgroundService.ProcessCredentialIssuance: it cleans Replay before Pending.
      // See SSIBackgroundService's XML remarks for failure/recovery/date/cutover rules.
      #endregion
    }
  }
}
