using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.SSI;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_SSI_YoID_Replacement : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.InsertData(
        schema: "SSI",
        table: "CredentialIssuanceStatus",
        columns: ["Id", "Name", "DateCreated"],
        values: new object[,]
        {
          { new Guid("e350d1a4-59c7-446e-b9c2-6787510719e9"), CredentialIssuanceStatus.Reissue.ToString(), DateTimeOffset.UtcNow },
          { new Guid("a429e808-5dc6-4cdf-ac9a-752ad8b45d08"), CredentialIssuanceStatus.Revoke.ToString(), DateTimeOffset.UtcNow },
          { new Guid("d7e58996-720a-434a-9075-b8e89f37ca0e"), CredentialIssuanceStatus.Revoked.ToString(), DateTimeOffset.UtcNow },
          { new Guid("45da6c10-d302-4a58-a142-9ae7e05cb9cb"), CredentialIssuanceStatus.Deleted.ToString(), DateTimeOffset.UtcNow }
        });

      migrationBuilder.DropIndex(
        name: "IX_CredentialIssuance_SchemaTypeId_UserId_OrganizationId_MyOpp~",
        schema: "SSI",
        table: "CredentialIssuance");

      migrationBuilder.AddColumn<DateTimeOffset>(
        name: "DateDeleted",
        schema: "SSI",
        table: "CredentialIssuance",
        type: "timestamp with time zone",
        nullable: true);

      migrationBuilder.AddColumn<DateTimeOffset>(
        name: "DateRefreshRequested",
        schema: "SSI",
        table: "CredentialIssuance",
        type: "timestamp with time zone",
        nullable: true);

      migrationBuilder.AddColumn<DateTimeOffset>(
        name: "DateRevoked",
        schema: "SSI",
        table: "CredentialIssuance",
        type: "timestamp with time zone",
        nullable: true);

      migrationBuilder.AddColumn<Guid>(
        name: "ParentId",
        schema: "SSI",
        table: "CredentialIssuance",
        type: "uuid",
        nullable: true);

      migrationBuilder.CreateIndex(
        name: "IX_CredentialIssuance_ParentId",
        schema: "SSI",
        table: "CredentialIssuance",
        column: "ParentId",
        unique: true);

      migrationBuilder.CreateIndex(
        name: "IX_CredentialIssuance_SchemaTypeId_UserId_OrganizationId_MyOpp~",
        schema: "SSI",
        table: "CredentialIssuance",
        columns: ["SchemaTypeId", "UserId", "OrganizationId", "MyOpportunityId"],
        unique: true,
        filter: "\"ParentId\" IS NULL")
        .Annotation("Npgsql:NullsDistinct", false);

      migrationBuilder.AddForeignKey(
        name: "FK_CredentialIssuance_CredentialIssuance_ParentId",
        schema: "SSI",
        table: "CredentialIssuance",
        column: "ParentId",
        principalSchema: "SSI",
        principalTable: "CredentialIssuance",
        principalColumn: "Id");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      throw new NotSupportedException("YoID history cannot be collapsed into one issuance row per user. Restore a reviewed backup instead.");
    }
  }
}
