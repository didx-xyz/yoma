using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_SSI_Credential_Schema : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_CustomFieldDefinition_EntityType_EntityContext_DataType_IsR~",
          schema: "Core",
          table: "CustomFieldDefinition");

      migrationBuilder.DropIndex(
          name: "IX_CredentialIssuance_SchemaName_UserId_OrganizationId_MyOppor~",
          schema: "SSI",
          table: "CredentialIssuance");

      migrationBuilder.AddColumn<string>(
          name: "Group",
          schema: "SSI",
          table: "SchemaEntityProperty",
          type: "varchar(100)",
          nullable: true);

      migrationBuilder.AddColumn<int>(
          name: "SortOrder",
          schema: "SSI",
          table: "SchemaEntityProperty",
          type: "integer",
          nullable: true);

      migrationBuilder.AddColumn<string>(
          name: "SubGroup",
          schema: "SSI",
          table: "SchemaEntityProperty",
          type: "varchar(100)",
          nullable: true);

      migrationBuilder.AddColumn<bool>(
          name: "IsSchemaMapped",
          schema: "Core",
          table: "CustomFieldDefinition",
          type: "boolean",
          nullable: false,
          defaultValue: false);

      migrationBuilder.AlterColumn<string>(
          name: "SchemaVersion",
          schema: "SSI",
          table: "CredentialIssuance",
          type: "varchar(20)",
          nullable: true,
          oldClrType: typeof(string),
          oldType: "varchar(20)");

      migrationBuilder.CreateIndex(
          name: "IX_CustomFieldDefinition_EntityType_EntityContext_DataType_IsR~",
          schema: "Core",
          table: "CustomFieldDefinition",
          columns: ["EntityType", "EntityContext", "DataType", "IsRequired", "IsSystem", "IsSchemaMapped"]);

      migrationBuilder.CreateIndex(
          name: "IX_CredentialIssuance_SchemaTypeId_UserId_OrganizationId_MyOpp~",
          schema: "SSI",
          table: "CredentialIssuance",
          columns: ["SchemaTypeId", "UserId", "OrganizationId", "MyOpportunityId"],
          unique: true)
          .Annotation("Npgsql:NullsDistinct", false);

      ApplicationDb_SSI_Credential_Schema_Seeding.SeedCredentialIssuance(migrationBuilder);
      ApplicationDb_SSI_Credential_Schema_Seeding.SeedSchemaEntityProperties(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      ApplicationDb_SSI_Credential_Schema_Seeding.UnseedCredentialIssuance(migrationBuilder);

      migrationBuilder.DropIndex(
          name: "IX_CustomFieldDefinition_EntityType_EntityContext_DataType_IsR~",
          schema: "Core",
          table: "CustomFieldDefinition");

      migrationBuilder.DropIndex(
          name: "IX_CredentialIssuance_SchemaTypeId_UserId_OrganizationId_MyOpp~",
          schema: "SSI",
          table: "CredentialIssuance");

      migrationBuilder.DropColumn(
          name: "Group",
          schema: "SSI",
          table: "SchemaEntityProperty");

      migrationBuilder.DropColumn(
          name: "SortOrder",
          schema: "SSI",
          table: "SchemaEntityProperty");

      migrationBuilder.DropColumn(
          name: "SubGroup",
          schema: "SSI",
          table: "SchemaEntityProperty");

      migrationBuilder.DropColumn(
          name: "IsSchemaMapped",
          schema: "Core",
          table: "CustomFieldDefinition");

      migrationBuilder.AlterColumn<string>(
          name: "SchemaVersion",
          schema: "SSI",
          table: "CredentialIssuance",
          type: "varchar(20)",
          nullable: false,
          defaultValue: "",
          oldClrType: typeof(string),
          oldType: "varchar(20)",
          oldNullable: true);

      migrationBuilder.CreateIndex(
          name: "IX_CustomFieldDefinition_EntityType_EntityContext_DataType_IsR~",
          schema: "Core",
          table: "CustomFieldDefinition",
          columns: ["EntityType", "EntityContext", "DataType", "IsRequired", "IsSystem"]);

      migrationBuilder.CreateIndex(
          name: "IX_CredentialIssuance_SchemaName_UserId_OrganizationId_MyOppor~",
          schema: "SSI",
          table: "CredentialIssuance",
          columns: ["SchemaName", "UserId", "OrganizationId", "MyOpportunityId"],
          unique: true);
    }
  }
}
