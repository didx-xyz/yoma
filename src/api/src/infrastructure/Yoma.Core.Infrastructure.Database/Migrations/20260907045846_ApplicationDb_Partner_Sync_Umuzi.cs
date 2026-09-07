using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.PartnerSync;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  public partial class ApplicationDb_Partner_Sync_Umuzi : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      // UserAuthentication enables the existing navigation extension point only.
      // Phase one appends a correlation id; it does not provision or authenticate an Umuzi user.
      var capabilities = $$$"""{"{{{SyncType.Pull}}}":{"{{{EntityType.Opportunity}}}":["{{{SyncScope.Entity}}}","{{{SyncScope.Verification}}}","{{{SyncScope.UserAuthentication}}}"]}}""";
      migrationBuilder.InsertData(
        table: "Partner", schema: "PartnerSync",
        columns: ["Id", "Name", "Active", "ActionsEnabled", "SyncCapabilities", "DateCreated"],
        values: ["AF37680A-5B31-4DCE-BFD5-DA566F651286", SyncPartner.Umuzi.ToString(), true, null, capabilities, DateTimeOffset.UtcNow]);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DeleteData(table: "Partner", schema: "PartnerSync", keyColumn: "Id",
        keyValue: "AF37680A-5B31-4DCE-BFD5-DA566F651286");
    }
  }
}
