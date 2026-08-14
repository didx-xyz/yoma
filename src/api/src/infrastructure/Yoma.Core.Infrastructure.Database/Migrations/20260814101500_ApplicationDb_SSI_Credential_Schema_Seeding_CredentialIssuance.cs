using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static partial class ApplicationDb_SSI_Credential_Schema_Seeding
  {
    internal static void SeedCredentialIssuance(MigrationBuilder migrationBuilder)
    {
      #region Credential Issuance
      // Version describes the credential actually issued, not the earlier scheduling intent.
      migrationBuilder.Sql("""
        UPDATE "SSI"."CredentialIssuance" AS issuance
        SET "SchemaVersion" = NULL
        WHERE NOT EXISTS (
          SELECT 1
          FROM "SSI"."CredentialIssuanceStatus" AS status
          WHERE status."Id" = issuance."StatusId"
            AND status."Name" = 'Issued'
        );
        """);
      #endregion Credential Issuance
    }

    internal static void UnseedCredentialIssuance(MigrationBuilder migrationBuilder)
    {
      #region Credential Issuance
      migrationBuilder.Sql("""
        UPDATE "SSI"."CredentialIssuance"
        SET "SchemaVersion" = ''
        WHERE "SchemaVersion" IS NULL;
        """);
      #endregion Credential Issuance
    }
  }
}
