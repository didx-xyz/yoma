using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Oporunity_External_Id : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_Opportunity_ExternalId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropIndex(
          name: "IX_Opportunity_OrganizationId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_OrganizationId_ExternalId",
          schema: "Opportunity",
          table: "Opportunity",
          columns: ["OrganizationId", "ExternalId"],
          unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_Opportunity_OrganizationId_ExternalId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_ExternalId",
          schema: "Opportunity",
          table: "Opportunity",
          column: "ExternalId",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_OrganizationId",
          schema: "Opportunity",
          table: "Opportunity",
          column: "OrganizationId");
    }
  }
}
