using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Opportunity_ShareWithPartners : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_Opportunity_TypeId_OrganizationId_ZltoReward_DifficultyId_C~",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.AddColumn<bool>(
          name: "ShareWithPartners",
          schema: "Opportunity",
          table: "Opportunity",
          type: "boolean",
          nullable: true);

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_TypeId_OrganizationId_ZltoReward_DifficultyId_C~",
          schema: "Opportunity",
          table: "Opportunity",
          columns: ["TypeId", "OrganizationId", "ZltoReward", "DifficultyId", "CommitmentIntervalId", "CommitmentIntervalCount", "StatusId", "Keywords", "DateStart", "DateEnd", "CredentialIssuanceEnabled", "Featured", "EngagementTypeId", "ShareWithPartners", "DateCreated", "CreatedByUserId", "DateModified", "ModifiedByUserId"]);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_Opportunity_TypeId_OrganizationId_ZltoReward_DifficultyId_C~",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropColumn(
          name: "ShareWithPartners",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_TypeId_OrganizationId_ZltoReward_DifficultyId_C~",
          schema: "Opportunity",
          table: "Opportunity",
          columns: ["TypeId", "OrganizationId", "ZltoReward", "DifficultyId", "CommitmentIntervalId", "CommitmentIntervalCount", "StatusId", "Keywords", "DateStart", "DateEnd", "CredentialIssuanceEnabled", "Featured", "EngagementTypeId", "DateCreated", "CreatedByUserId", "DateModified", "ModifiedByUserId"]);
    }
  }
}
