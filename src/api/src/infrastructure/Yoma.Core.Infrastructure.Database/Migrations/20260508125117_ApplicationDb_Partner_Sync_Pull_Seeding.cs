using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.PartnerSync;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal class ApplicationDb_Partner_Sync_Pull_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region PartnerSync
      #region Lookups
      var syncTypesEnabledPullOpportunity = $$$"""{"{{{SyncType.Pull}}}":["{{{EntityType.Opportunity}}}"]}""";

      migrationBuilder.InsertData(
        table: "Partner",
        schema: "PartnerSync",
        columns: ["Id", "Name", "Active", "ActionEnabled", "SyncTypesEnabled", "DateCreated"],
        values: new object?[,]
        {
          { "D5E7C8D2-6D74-4C6C-9B78-9A2F5F0A1B11", SyncPartner.Jobberman.ToString(), true, null, syncTypesEnabledPullOpportunity, DateTimeOffset.UtcNow },
          { "8A8A5A8E-2B0A-4E2D-9A62-5C4C1F7E2D33", SyncPartner.Alison.ToString(), false, null, syncTypesEnabledPullOpportunity, DateTimeOffset.UtcNow }
        });
      #endregion Lookups
      #endregion PartnerSync
    }
  }
}
