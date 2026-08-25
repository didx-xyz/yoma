using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.PartnerSync;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Partner_Sync_IXO : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      #region PartnerSync
      #region Lookups
      var syncCapabilities = $$$"""{"{{{SyncType.Pull}}}":{"{{{EntityType.Opportunity}}}":["{{{SyncScope.Entity}}}","{{{SyncScope.Verification}}}","{{{SyncScope.UserAuthentication}}}"]}}""";

      migrationBuilder.InsertData(
        table: "Partner",
        schema: "PartnerSync",
        columns: ["Id", "Name", "Active", "ActionsEnabled", "SyncCapabilities", "DateCreated"],
        values: ["DB37159B-1B8A-49EF-A2E5-E607DB639532", SyncPartner.IXO.ToString(), true, null, syncCapabilities, DateTimeOffset.UtcNow]);
      #endregion Lookups
      #endregion PartnerSync
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      #region PartnerSync
      #region Lookups
      migrationBuilder.DeleteData(
        table: "Partner",
        schema: "PartnerSync",
        keyColumn: "Id",
        keyValue: "DB37159B-1B8A-49EF-A2E5-E607DB639532");
      #endregion Lookups
      #endregion PartnerSync
    }
  }
}
