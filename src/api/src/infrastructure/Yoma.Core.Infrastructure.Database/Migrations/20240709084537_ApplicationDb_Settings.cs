using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Settings : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropForeignKey(
          name: "FK_ProcessingLog_Status_StatusId",
          schema: "PartnerSharing",
          table: "ProcessingLog");

      migrationBuilder.DropPrimaryKey(
          name: "PK_Status",
          schema: "PartnerSharing",
          table: "Status");

      migrationBuilder.RenameTable(
          name: "Status",
          schema: "PartnerSharing",
          newName: "ProcessingStatus",
          newSchema: "PartnerSharing");

      migrationBuilder.RenameColumn(
          name: "ActionStatus",
          schema: "PartnerSharing",
          table: "Partner",
          newName: "ActionEnabled");

      migrationBuilder.RenameIndex(
          name: "IX_Status_Name1",
          schema: "PartnerSharing",
          table: "ProcessingStatus",
          newName: "IX_ProcessingStatus_Name");

      migrationBuilder.AddColumn<string>(
          name: "Settings",
          schema: "Entity",
          table: "User",
          type: "text",
          nullable: true);

      migrationBuilder.AddPrimaryKey(
          name: "PK_ProcessingStatus",
          schema: "PartnerSharing",
          table: "ProcessingStatus",
          column: "Id");

      migrationBuilder.CreateTable(
          name: "SettingsDefinition",
          schema: "Entity",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            EntityType = table.Column<string>(type: "varchar(25)", nullable: false),
            Key = table.Column<string>(type: "varchar(100)", nullable: false),
            Title = table.Column<string>(type: "varchar(100)", nullable: false),
            Description = table.Column<string>(type: "varchar(500)", nullable: false),
            Group = table.Column<string>(type: "varchar(100)", nullable: false),
            SubGroup = table.Column<string>(type: "varchar(100)", nullable: true),
            Order = table.Column<short>(type: "smallint", nullable: false),
            Roles = table.Column<string>(type: "jsonb", nullable: false),
            DefaultValue = table.Column<string>(type: "varchar(50)", nullable: false),
            Type = table.Column<string>(type: "varchar(50)", nullable: false),
            Enabled = table.Column<bool>(type: "boolean", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_SettingsDefinition", x => x.Id);
          });

      migrationBuilder.CreateIndex(
          name: "IX_SettingsDefinition_EntityType_Key",
          schema: "Entity",
          table: "SettingsDefinition",
          columns: ["EntityType", "Key"],
          unique: true);

      migrationBuilder.AddForeignKey(
          name: "FK_ProcessingLog_ProcessingStatus_StatusId",
          schema: "PartnerSharing",
          table: "ProcessingLog",
          column: "StatusId",
          principalSchema: "PartnerSharing",
          principalTable: "ProcessingStatus",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      ApplicationDb_Settings_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropForeignKey(
          name: "FK_ProcessingLog_ProcessingStatus_StatusId",
          schema: "PartnerSharing",
          table: "ProcessingLog");

      migrationBuilder.DropTable(
          name: "SettingsDefinition",
          schema: "Entity");

      migrationBuilder.DropPrimaryKey(
          name: "PK_ProcessingStatus",
          schema: "PartnerSharing",
          table: "ProcessingStatus");

      migrationBuilder.DropColumn(
          name: "Settings",
          schema: "Entity",
          table: "User");

      migrationBuilder.RenameTable(
          name: "ProcessingStatus",
          schema: "PartnerSharing",
          newName: "Status",
          newSchema: "PartnerSharing");

      migrationBuilder.RenameColumn(
          name: "ActionEnabled",
          schema: "PartnerSharing",
          table: "Partner",
          newName: "ActionStatus");

      migrationBuilder.RenameIndex(
          name: "IX_ProcessingStatus_Name",
          schema: "PartnerSharing",
          table: "Status",
          newName: "IX_Status_Name1");

      migrationBuilder.AddPrimaryKey(
          name: "PK_Status",
          schema: "PartnerSharing",
          table: "Status",
          column: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_ProcessingLog_Status_StatusId",
          schema: "PartnerSharing",
          table: "ProcessingLog",
          column: "StatusId",
          principalSchema: "PartnerSharing",
          principalTable: "Status",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);
    }
  }
}
