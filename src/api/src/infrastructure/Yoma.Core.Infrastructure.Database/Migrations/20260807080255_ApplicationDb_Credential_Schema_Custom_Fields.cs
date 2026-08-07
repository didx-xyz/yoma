using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Credential_Schema_Custom_Fields : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_CustomFieldDefinition_EntityType_EntityContext_DataType_IsR~",
          schema: "Core",
          table: "CustomFieldDefinition");

      migrationBuilder.AddColumn<bool>(
          name: "IsSchemaMapped",
          schema: "Core",
          table: "CustomFieldDefinition",
          type: "boolean",
          nullable: false,
          defaultValue: false);

      migrationBuilder.CreateIndex(
          name: "IX_CustomFieldDefinition_EntityType_EntityContext_DataType_IsR~",
          schema: "Core",
          table: "CustomFieldDefinition",
          columns: ["EntityType", "EntityContext", "DataType", "IsRequired", "IsSystem", "IsSchemaMapped"]);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_CustomFieldDefinition_EntityType_EntityContext_DataType_IsR~",
          schema: "Core",
          table: "CustomFieldDefinition");

      migrationBuilder.DropColumn(
          name: "IsSchemaMapped",
          schema: "Core",
          table: "CustomFieldDefinition");

      migrationBuilder.CreateIndex(
          name: "IX_CustomFieldDefinition_EntityType_EntityContext_DataType_IsR~",
          schema: "Core",
          table: "CustomFieldDefinition",
          columns: ["EntityType", "EntityContext", "DataType", "IsRequired", "IsSystem"]);
    }
  }
}
