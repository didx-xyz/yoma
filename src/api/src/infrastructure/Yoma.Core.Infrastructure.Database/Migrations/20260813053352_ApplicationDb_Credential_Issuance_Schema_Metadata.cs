using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Credential_Issuance_Schema_Metadata : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_CredentialIssuance_SchemaName_UserId_OrganizationId_MyOppor~",
          schema: "SSI",
          table: "CredentialIssuance");

      migrationBuilder.AlterColumn<string>(
          name: "SchemaVersion",
          schema: "SSI",
          table: "CredentialIssuance",
          type: "varchar(20)",
          nullable: true,
          oldClrType: typeof(string),
          oldType: "varchar(20)");

      // Version describes the credential actually issued, not the earlier scheduling intent.
      migrationBuilder.Sql("""
        UPDATE "SSI"."CredentialIssuance" AS issuance
        SET "SchemaVersion" = NULL
        WHERE NOT EXISTS (
          SELECT 1
          FROM "SSI"."CredentialIssuanceStatus" AS status
          WHERE status."Id" = issuance."StatusId"
            AND status."Name" = 'Issued'
        );
        """);

      migrationBuilder.CreateIndex(
          name: "IX_CredentialIssuance_SchemaTypeId_UserId_OrganizationId_MyOpp~",
          schema: "SSI",
          table: "CredentialIssuance",
          columns: ["SchemaTypeId", "UserId", "OrganizationId", "MyOpportunityId"],
          unique: true)
          .Annotation("Npgsql:NullsDistinct", false);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_CredentialIssuance_SchemaTypeId_UserId_OrganizationId_MyOpp~",
          schema: "SSI",
          table: "CredentialIssuance");

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
          name: "IX_CredentialIssuance_SchemaName_UserId_OrganizationId_MyOppor~",
          schema: "SSI",
          table: "CredentialIssuance",
          columns: ["SchemaName", "UserId", "OrganizationId", "MyOpportunityId"],
          unique: true);
    }
  }
}
