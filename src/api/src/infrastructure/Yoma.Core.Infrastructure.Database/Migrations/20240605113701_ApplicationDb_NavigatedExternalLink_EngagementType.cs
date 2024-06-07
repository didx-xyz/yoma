using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_NavigatedExternalLink_EngagementType : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_Opportunity_TypeId_OrganizationId_ZltoReward_DifficultyId_C~",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.AddColumn<Guid>(
          name: "EngagementTypeId",
          schema: "Opportunity",
          table: "Opportunity",
          type: "uuid",
          nullable: true);

      migrationBuilder.CreateTable(
          name: "EngagementType",
          schema: "Lookup",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Name = table.Column<string>(type: "varchar(20)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_EngagementType", x => x.Id);
          });

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_EngagementTypeId",
          schema: "Opportunity",
          table: "Opportunity",
          column: "EngagementTypeId");

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_TypeId_OrganizationId_ZltoReward_DifficultyId_C~",
          schema: "Opportunity",
          table: "Opportunity",
          columns: ["TypeId", "OrganizationId", "ZltoReward", "DifficultyId", "CommitmentIntervalId", "CommitmentIntervalCount", "StatusId", "Keywords", "DateStart", "DateEnd", "CredentialIssuanceEnabled", "Featured", "EngagementTypeId", "DateCreated", "CreatedByUserId", "DateModified", "ModifiedByUserId"]);

      migrationBuilder.CreateIndex(
          name: "IX_EngagementType_Name",
          schema: "Lookup",
          table: "EngagementType",
          column: "Name",
          unique: true);

      migrationBuilder.AddForeignKey(
          name: "FK_Opportunity_EngagementType_EngagementTypeId",
          schema: "Opportunity",
          table: "Opportunity",
          column: "EngagementTypeId",
          principalSchema: "Lookup",
          principalTable: "EngagementType",
          principalColumn: "Id");

      ApplicationDb_NavigatedExternalLink_EngagementType_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropForeignKey(
          name: "FK_Opportunity_EngagementType_EngagementTypeId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropTable(
          name: "EngagementType",
          schema: "Lookup");

      migrationBuilder.DropIndex(
          name: "IX_Opportunity_EngagementTypeId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropIndex(
          name: "IX_Opportunity_TypeId_OrganizationId_ZltoReward_DifficultyId_C~",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropColumn(
          name: "EngagementTypeId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_TypeId_OrganizationId_ZltoReward_DifficultyId_C~",
          schema: "Opportunity",
          table: "Opportunity",
          columns: ["TypeId", "OrganizationId", "ZltoReward", "DifficultyId", "CommitmentIntervalId", "CommitmentIntervalCount", "StatusId", "Keywords", "DateStart", "DateEnd", "CredentialIssuanceEnabled", "Featured", "DateCreated", "CreatedByUserId", "DateModified", "ModifiedByUserId"]);
    }
  }
}
