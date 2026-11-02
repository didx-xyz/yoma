using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.DidxMe.Migrations
{
  /// <inheritdoc />
  public partial class ProviderDb_PresetAndIssuanceMappings : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      // Terminology only: preserve the existing preset mappings, issuance IDs and progress.
      migrationBuilder.DropForeignKey(
        name: "FK_Issuance_CredentialSchema_SchemaId",
        schema: "DidxMe",
        table: "Issuance");

      migrationBuilder.DropPrimaryKey(
        name: "PK_Issuance",
        schema: "DidxMe",
        table: "Issuance");

      migrationBuilder.DropPrimaryKey(
        name: "PK_CredentialSchema",
        schema: "DidxMe",
        table: "CredentialSchema");

      migrationBuilder.RenameTable(
        name: "CredentialSchema",
        schema: "DidxMe",
        newName: "CredentialPresetMapping");

      migrationBuilder.RenameTable(
        name: "Issuance",
        schema: "DidxMe",
        newName: "IssuanceMapping");

      migrationBuilder.RenameColumn(
        name: "SchemaId",
        schema: "DidxMe",
        table: "IssuanceMapping",
        newName: "PresetMappingId");

      migrationBuilder.RenameIndex(
        name: "IX_CredentialSchema_TenantAlias_Name_Version",
        schema: "DidxMe",
        table: "CredentialPresetMapping",
        newName: "IX_CredentialPresetMapping_TenantAlias_Name_Version");

      migrationBuilder.RenameIndex(
        name: "IX_CredentialSchema_TenantAlias_Vct",
        schema: "DidxMe",
        table: "CredentialPresetMapping",
        newName: "IX_CredentialPresetMapping_TenantAlias_Vct");

      migrationBuilder.RenameIndex(
        name: "IX_Issuance_SchemaId",
        schema: "DidxMe",
        table: "IssuanceMapping",
        newName: "IX_IssuanceMapping_PresetMappingId");

      migrationBuilder.RenameIndex(
        name: "IX_Issuance_TenantAlias_TenantIdHolder_ClientReferentValue",
        schema: "DidxMe",
        table: "IssuanceMapping",
        newName: "IX_IssuanceMapping_TenantAlias_TenantIdHolder_ClientReferentVa~");

      migrationBuilder.AddPrimaryKey(
        name: "PK_CredentialPresetMapping",
        schema: "DidxMe",
        table: "CredentialPresetMapping",
        column: "Id");

      migrationBuilder.AddPrimaryKey(
        name: "PK_IssuanceMapping",
        schema: "DidxMe",
        table: "IssuanceMapping",
        column: "Id");

      migrationBuilder.AddForeignKey(
        name: "FK_IssuanceMapping_CredentialPresetMapping_PresetMappingId",
        schema: "DidxMe",
        table: "IssuanceMapping",
        column: "PresetMappingId",
        principalSchema: "DidxMe",
        principalTable: "CredentialPresetMapping",
        principalColumn: "Id",
        onDelete: ReferentialAction.Cascade);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropForeignKey(
        name: "FK_IssuanceMapping_CredentialPresetMapping_PresetMappingId",
        schema: "DidxMe",
        table: "IssuanceMapping");

      migrationBuilder.DropPrimaryKey(
        name: "PK_IssuanceMapping",
        schema: "DidxMe",
        table: "IssuanceMapping");

      migrationBuilder.DropPrimaryKey(
        name: "PK_CredentialPresetMapping",
        schema: "DidxMe",
        table: "CredentialPresetMapping");

      migrationBuilder.RenameTable(
        name: "CredentialPresetMapping",
        schema: "DidxMe",
        newName: "CredentialSchema");

      migrationBuilder.RenameTable(
        name: "IssuanceMapping",
        schema: "DidxMe",
        newName: "Issuance");

      migrationBuilder.RenameColumn(
        name: "PresetMappingId",
        schema: "DidxMe",
        table: "Issuance",
        newName: "SchemaId");

      migrationBuilder.RenameIndex(
        name: "IX_CredentialPresetMapping_TenantAlias_Name_Version",
        schema: "DidxMe",
        table: "CredentialSchema",
        newName: "IX_CredentialSchema_TenantAlias_Name_Version");

      migrationBuilder.RenameIndex(
        name: "IX_CredentialPresetMapping_TenantAlias_Vct",
        schema: "DidxMe",
        table: "CredentialSchema",
        newName: "IX_CredentialSchema_TenantAlias_Vct");

      migrationBuilder.RenameIndex(
        name: "IX_IssuanceMapping_PresetMappingId",
        schema: "DidxMe",
        table: "Issuance",
        newName: "IX_Issuance_SchemaId");

      migrationBuilder.RenameIndex(
        name: "IX_IssuanceMapping_TenantAlias_TenantIdHolder_ClientReferentVa~",
        schema: "DidxMe",
        table: "Issuance",
        newName: "IX_Issuance_TenantAlias_TenantIdHolder_ClientReferentValue");

      migrationBuilder.AddPrimaryKey(
        name: "PK_CredentialSchema",
        schema: "DidxMe",
        table: "CredentialSchema",
        column: "Id");

      migrationBuilder.AddPrimaryKey(
        name: "PK_Issuance",
        schema: "DidxMe",
        table: "Issuance",
        column: "Id");

      migrationBuilder.AddForeignKey(
        name: "FK_Issuance_CredentialSchema_SchemaId",
        schema: "DidxMe",
        table: "Issuance",
        column: "SchemaId",
        principalSchema: "DidxMe",
        principalTable: "CredentialSchema",
        principalColumn: "Id",
        onDelete: ReferentialAction.Cascade);
    }
  }
}
