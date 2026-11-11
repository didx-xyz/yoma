using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.DidxMe.Migrations
{
  /// <inheritdoc />
  public partial class ProviderDb_Initial : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.EnsureSchema(
          name: "DidxMe");

      migrationBuilder.CreateTable(
          name: "CredentialSchema",
          schema: "DidxMe",
          columns: table => new
          {
            Id = table.Column<string>(type: "varchar(125)", nullable: false),
            TenantAlias = table.Column<string>(type: "varchar(125)", nullable: false),
            Name = table.Column<string>(type: "varchar(125)", nullable: false),
            Version = table.Column<string>(type: "varchar(20)", nullable: false),
            ArtifactType = table.Column<string>(type: "varchar(20)", nullable: false),
            AttributeNames = table.Column<string>(type: "text", nullable: false),
            PresetId = table.Column<string>(type: "varchar(250)", nullable: false),
            Vct = table.Column<string>(type: "varchar(500)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_CredentialSchema", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "Issuance",
          schema: "DidxMe",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            TenantAlias = table.Column<string>(type: "varchar(125)", nullable: false),
            SchemaId = table.Column<string>(type: "varchar(125)", nullable: false),
            TenantIdIssuer = table.Column<string>(type: "varchar(125)", nullable: false),
            TenantIdHolder = table.Column<string>(type: "varchar(125)", nullable: false),
            ClientReferentKey = table.Column<string>(type: "varchar(125)", nullable: false),
            ClientReferentValue = table.Column<string>(type: "varchar(125)", nullable: false),
            IssuanceId = table.Column<string>(type: "varchar(125)", nullable: true),
            IssuerCredentialId = table.Column<string>(type: "varchar(125)", nullable: true),
            WalletCredentialId = table.Column<string>(type: "varchar(125)", nullable: true),
            DeliveryCompleted = table.Column<bool>(type: "boolean", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Issuance", x => x.Id);
            table.ForeignKey(
                      name: "FK_Issuance_CredentialSchema_SchemaId",
                      column: x => x.SchemaId,
                      principalSchema: "DidxMe",
                      principalTable: "CredentialSchema",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateIndex(
          name: "IX_CredentialSchema_TenantAlias_Name_Version",
          schema: "DidxMe",
          table: "CredentialSchema",
          columns: ["TenantAlias", "Name", "Version"],
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_CredentialSchema_TenantAlias_Vct",
          schema: "DidxMe",
          table: "CredentialSchema",
          columns: ["TenantAlias", "Vct"],
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Issuance_SchemaId",
          schema: "DidxMe",
          table: "Issuance",
          column: "SchemaId");

      migrationBuilder.CreateIndex(
          name: "IX_Issuance_TenantAlias_TenantIdHolder_ClientReferentValue",
          schema: "DidxMe",
          table: "Issuance",
          columns: ["TenantAlias", "TenantIdHolder", "ClientReferentValue"]);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
          name: "Issuance",
          schema: "DidxMe");

      migrationBuilder.DropTable(
          name: "CredentialSchema",
          schema: "DidxMe");
    }
  }
}
