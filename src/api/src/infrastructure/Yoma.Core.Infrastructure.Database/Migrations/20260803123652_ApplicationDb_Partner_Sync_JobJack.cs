using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.PartnerSync;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Partner_Sync_JobJack : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      #region PartnerSync
      #region Lookups
      var syncCapabilities = $$$"""{"{{{SyncType.Pull}}}":{"{{{EntityType.Opportunity}}}":["{{{SyncScope.Entity}}}"]}}""";

      migrationBuilder.InsertData(
        table: "Partner",
        schema: "PartnerSync",
        columns: ["Id", "Name", "Active", "ActionsEnabled", "SyncCapabilities", "DateCreated"],
        values: ["7C0E78BB-59F5-4E0E-A12A-9DA9835673AB", SyncPartner.JobJack.ToString(), true, null, syncCapabilities, DateTimeOffset.UtcNow]);
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
        keyValue: "7C0E78BB-59F5-4E0E-A12A-9DA9835673AB");
      #endregion Lookups
      #endregion PartnerSync
    }
  }
}
