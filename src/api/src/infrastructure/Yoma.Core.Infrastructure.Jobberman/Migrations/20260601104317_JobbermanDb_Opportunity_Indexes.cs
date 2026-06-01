using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Jobberman.Migrations
{
  /// <inheritdoc />
  public partial class JobbermanDb_Opportunity_Indexes : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_Opportunity_ExternalId_DateCreated_DateModified",
          schema: "Jobberman",
          table: "Opportunity");

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_CountryCodeAlpha2_Deleted_DateModified",
          schema: "Jobberman",
          table: "Opportunity",
          columns: ["CountryCodeAlpha2", "Deleted", "DateModified"]);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_Opportunity_CountryCodeAlpha2_Deleted_DateModified",
          schema: "Jobberman",
          table: "Opportunity");

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_ExternalId_DateCreated_DateModified",
          schema: "Jobberman",
          table: "Opportunity",
          columns: ["ExternalId", "DateCreated", "DateModified"]);
    }
  }
}
