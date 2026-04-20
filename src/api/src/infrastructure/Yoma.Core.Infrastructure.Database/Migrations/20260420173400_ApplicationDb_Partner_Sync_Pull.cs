using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Partner_Sync_Pull : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_ProcessingLog_EntityType_OpportunityId_PartnerId_Action_Sta~",
          schema: "PartnerSharing",
          table: "ProcessingLog");

      migrationBuilder.EnsureSchema(
          name: "PartnerSync");

      migrationBuilder.RenameTable(
          name: "ProcessingStatus",
          schema: "PartnerSharing",
          newName: "ProcessingStatus",
          newSchema: "PartnerSync");

      migrationBuilder.RenameTable(
          name: "ProcessingLog",
          schema: "PartnerSharing",
          newName: "ProcessingLog",
          newSchema: "PartnerSync");

      migrationBuilder.RenameTable(
          name: "Partner",
          schema: "PartnerSharing",
          newName: "Partner",
          newSchema: "PartnerSync");

      migrationBuilder.AddColumn<string>(
          name: "SyncType",
          schema: "PartnerSync",
          table: "ProcessingLog",
          type: "varchar(25)",
          nullable: false,
          defaultValue: "Push");

      migrationBuilder.AddColumn<string>(
          name: "SyncTypesEnabled",
          schema: "PartnerSync",
          table: "Partner",
          type: "text",
          nullable: false,
          defaultValue: "{\"Push\":[\"Opportunity\"]}");

      migrationBuilder.CreateIndex(
          name: "IX_ProcessingLog_EntityType_OpportunityId_PartnerId_Action_Syn~",
          schema: "PartnerSync",
          table: "ProcessingLog",
          columns: ["EntityType", "OpportunityId", "PartnerId", "Action", "SyncType", "StatusId", "EntityExternalId", "DateCreated", "DateModified"]);

      migrationBuilder.DropSchema(
        name: "PartnerSharing");

      ApplicationDb_Partner_Sync_Pull_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_ProcessingLog_EntityType_OpportunityId_PartnerId_Action_Syn~",
          schema: "PartnerSync",
          table: "ProcessingLog");

      migrationBuilder.DropColumn(
          name: "SyncType",
          schema: "PartnerSync",
          table: "ProcessingLog");

      migrationBuilder.DropColumn(
          name: "SyncTypesEnabled",
          schema: "PartnerSync",
          table: "Partner");

      migrationBuilder.EnsureSchema(
          name: "PartnerSharing");

      migrationBuilder.RenameTable(
          name: "ProcessingStatus",
          schema: "PartnerSync",
          newName: "ProcessingStatus",
          newSchema: "PartnerSharing");

      migrationBuilder.RenameTable(
          name: "ProcessingLog",
          schema: "PartnerSync",
          newName: "ProcessingLog",
          newSchema: "PartnerSharing");

      migrationBuilder.RenameTable(
          name: "Partner",
          schema: "PartnerSync",
          newName: "Partner",
          newSchema: "PartnerSharing");

      migrationBuilder.CreateIndex(
          name: "IX_ProcessingLog_EntityType_OpportunityId_PartnerId_Action_Sta~",
          schema: "PartnerSharing",
          table: "ProcessingLog",
          columns: ["EntityType", "OpportunityId", "PartnerId", "Action", "StatusId", "EntityExternalId", "DateCreated", "DateModified"]);

      migrationBuilder.DropSchema(
        name: "PartnerSync");
    }
  }
}
