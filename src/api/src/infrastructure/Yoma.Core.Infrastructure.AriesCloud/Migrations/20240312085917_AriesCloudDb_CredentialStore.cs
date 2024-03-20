using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.AriesCloud.Migrations
{
  /// <inheritdoc />
  public partial class AriesCloudDb_CredentialStore : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_CredentialSchema_Name_ArtifactType",
          schema: "AriesCloud",
          table: "CredentialSchema");

      migrationBuilder.CreateTable(
          name: "Credential",
          schema: "AriesCloud",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            ClientReferent = table.Column<string>(type: "varchar(50)", nullable: false),
            SourceTenantId = table.Column<string>(type: "varchar(50)", nullable: false),
            TargetTenantId = table.Column<string>(type: "varchar(50)", nullable: false),
            SchemaId = table.Column<string>(type: "varchar(125)", nullable: false),
            ArtifactType = table.Column<string>(type: "varchar(20)", nullable: false),
            Attributes = table.Column<string>(type: "text", nullable: false),
            SignedValue = table.Column<string>(type: "text", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Credential", x => x.Id);
          });

      migrationBuilder.CreateIndex(
          name: "IX_CredentialSchema_Name_Version_ArtifactType",
          schema: "AriesCloud",
          table: "CredentialSchema",
          columns: ["Name", "Version", "ArtifactType"]);

      migrationBuilder.CreateIndex(
          name: "IX_Credential_ClientReferent",
          schema: "AriesCloud",
          table: "Credential",
          column: "ClientReferent",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Credential_SourceTenantId_TargetTenantId_ArtifactType",
          schema: "AriesCloud",
          table: "Credential",
          columns: ["SourceTenantId", "TargetTenantId", "ArtifactType"]);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
          name: "Credential",
          schema: "AriesCloud");

      migrationBuilder.DropIndex(
          name: "IX_CredentialSchema_Name_Version_ArtifactType",
          schema: "AriesCloud",
          table: "CredentialSchema");

      migrationBuilder.CreateIndex(
          name: "IX_CredentialSchema_Name_ArtifactType",
          schema: "AriesCloud",
          table: "CredentialSchema",
          columns: ["Name", "ArtifactType"]);
    }
  }
}
