using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Opportunity_Hidden : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_Opportunity_TypeId_OrganizationId_ZltoReward_DifficultyId_C~",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.AddColumn<string>(
          name: "ExternalId",
          schema: "Opportunity",
          table: "Opportunity",
          type: "varchar(50)",
          nullable: true);

      migrationBuilder.AddColumn<bool>(
          name: "Hidden",
          schema: "Opportunity",
          table: "Opportunity",
          type: "boolean",
          nullable: true);

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_ExternalId",
          schema: "Opportunity",
          table: "Opportunity",
          column: "ExternalId",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_TypeId_OrganizationId_ZltoReward_DifficultyId_C~",
          schema: "Opportunity",
          table: "Opportunity",
          columns: ["TypeId", "OrganizationId", "ZltoReward", "DifficultyId", "CommitmentIntervalId", "CommitmentIntervalCount", "StatusId", "Keywords", "DateStart", "DateEnd", "CredentialIssuanceEnabled", "Featured", "EngagementTypeId", "ShareWithPartners", "Hidden", "DateCreated", "CreatedByUserId", "DateModified", "ModifiedByUserId"]);

      migrationBuilder.Sql("CREATE INDEX \"IX_StoreAccessControlRule_Name_Lower\" ON \"Marketplace\".\"StoreAccessControlRule\" (LOWER(\"Name\"));");
      migrationBuilder.Sql("CREATE INDEX \"IX_Opporunity_ExternalId_Lower\" ON \"Opportunity\".\"Opportunity\" (LOWER(\"ExternalId\"));");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_StoreAccessControlRule_Name_Lower\";");
      migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Opporunity_ExternalId_Lower\";");

      migrationBuilder.DropIndex(
          name: "IX_Opportunity_ExternalId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropIndex(
          name: "IX_Opportunity_TypeId_OrganizationId_ZltoReward_DifficultyId_C~",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropColumn(
          name: "ExternalId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropColumn(
          name: "Hidden",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_TypeId_OrganizationId_ZltoReward_DifficultyId_C~",
          schema: "Opportunity",
          table: "Opportunity",
          columns: ["TypeId", "OrganizationId", "ZltoReward", "DifficultyId", "CommitmentIntervalId", "CommitmentIntervalCount", "StatusId", "Keywords", "DateStart", "DateEnd", "CredentialIssuanceEnabled", "Featured", "EngagementTypeId", "ShareWithPartners", "DateCreated", "CreatedByUserId", "DateModified", "ModifiedByUserId"]);
    }
  }
}
