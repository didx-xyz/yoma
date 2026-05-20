using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.PartnerSync;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_Partner_Sync_Capabilities_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region PartnerSync
      #region Lookups
      migrationBuilder.Sql($$$"""
        UPDATE "PartnerSync"."Partner"
        SET "SyncCapabilities" = '{"{{{SyncType.Pull}}}":{"{{{EntityType.Opportunity}}}":["{{{SyncScope.Entity}}}","{{{SyncScope.Verification}}}"]}}'
        WHERE "Id" = '8A8A5A8E-2B0A-4E2D-9A62-5C4C1F7E2D33';
        """);
      #endregion Lookups
      #endregion PartnerSync
    }
  }
}
