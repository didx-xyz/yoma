using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.PartnerSync;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Partner_Sync_Partner : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      #region PartnerSync
      #region Lookups
      migrationBuilder.Sql($$$"""
        UPDATE "PartnerSync"."Partner"
        SET "SyncCapabilities" = '{"{{{SyncType.Pull}}}":{"{{{EntityType.Opportunity}}}":["{{{SyncScope.Entity}}}","{{{SyncScope.Verification}}}","{{{SyncScope.UserAuthentication}}}"]}}'
        WHERE "Id" = '8A8A5A8E-2B0A-4E2D-9A62-5C4C1F7E2D33';
        """);
      #endregion Lookups
      #endregion PartnerSync
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
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
