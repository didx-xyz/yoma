using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.DidxMe.Migrations
{
  /// <inheritdoc />
  public partial class ProviderDb_IssuanceTracking : Migration
  {
    private static readonly string[] IssuanceIndexColumns = ["TenantAlias", "IssuanceId"];
    private static readonly string[] WalletCredentialIndexColumns = ["TenantAlias", "WalletCredentialId"];

    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      // Existing rows track issued credentials. New attempts explicitly start as Prepared in the service.
      migrationBuilder.AddColumn<string>(
        name: "Status",
        schema: "DidxMe",
        table: "IssuanceMapping",
        type: "varchar(25)",
        nullable: false,
        defaultValue: IssuanceStatus.Accepted.ToString());

      migrationBuilder.CreateIndex(
        name: "IX_IssuanceMapping_TenantAlias_IssuanceId",
        schema: "DidxMe",
        table: "IssuanceMapping",
        columns: IssuanceIndexColumns);

      migrationBuilder.CreateIndex(
        name: "IX_IssuanceMapping_TenantAlias_WalletCredentialId",
        schema: "DidxMe",
        table: "IssuanceMapping",
        columns: WalletCredentialIndexColumns);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
        name: "IX_IssuanceMapping_TenantAlias_IssuanceId",
        schema: "DidxMe",
        table: "IssuanceMapping");

      migrationBuilder.DropIndex(
        name: "IX_IssuanceMapping_TenantAlias_WalletCredentialId",
        schema: "DidxMe",
        table: "IssuanceMapping");

      migrationBuilder.DropColumn(
        name: "Status",
        schema: "DidxMe",
        table: "IssuanceMapping");
    }
  }
}
