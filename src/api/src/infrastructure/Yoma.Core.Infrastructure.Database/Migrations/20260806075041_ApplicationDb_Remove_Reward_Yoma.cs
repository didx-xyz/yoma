using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Remove_Reward_Yoma : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      ApplicationDb_Remove_Reward_Yoma_Seeding.SeedUp(migrationBuilder);

      migrationBuilder.DropIndex(
          name: "IX_MyOpportunity_VerificationStatusId_DateStart_DateEnd_DateCo~",
          schema: "Opportunity",
          table: "MyOpportunity");

      migrationBuilder.DropColumn(
          name: "YomaRewardCumulative",
          schema: "Entity",
          table: "Organization");

      migrationBuilder.DropColumn(
          name: "YomaRewardCumulativeCurrentFinancialYear",
          schema: "Entity",
          table: "Organization");

      migrationBuilder.DropColumn(
          name: "YomaRewardPoolCurrentFinancialYear",
          schema: "Entity",
          table: "Organization");

      migrationBuilder.DropColumn(
          name: "YomaReward",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropColumn(
          name: "YomaRewardCumulative",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropColumn(
          name: "YomaRewardPool",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropColumn(
          name: "YomaReward",
          schema: "Opportunity",
          table: "MyOpportunity");

      migrationBuilder.CreateIndex(
          name: "IX_MyOpportunity_VerificationStatusId_DateStart_DateEnd_DateCo~",
          schema: "Opportunity",
          table: "MyOpportunity",
          columns: ["VerificationStatusId", "DateStart", "DateEnd", "DateCompleted", "ZltoReward", "Recommendable", "StarRating", "DateCreated", "DateModified"]);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_MyOpportunity_VerificationStatusId_DateStart_DateEnd_DateCo~",
          schema: "Opportunity",
          table: "MyOpportunity");

      migrationBuilder.AddColumn<decimal>(
          name: "YomaRewardCumulative",
          schema: "Entity",
          table: "Organization",
          type: "numeric(12,2)",
          nullable: true);

      migrationBuilder.AddColumn<decimal>(
          name: "YomaRewardCumulativeCurrentFinancialYear",
          schema: "Entity",
          table: "Organization",
          type: "numeric(12,2)",
          nullable: true);

      migrationBuilder.AddColumn<decimal>(
          name: "YomaRewardPoolCurrentFinancialYear",
          schema: "Entity",
          table: "Organization",
          type: "numeric(12,2)",
          nullable: true);

      migrationBuilder.AddColumn<decimal>(
          name: "YomaReward",
          schema: "Opportunity",
          table: "Opportunity",
          type: "numeric(8,2)",
          nullable: true);

      migrationBuilder.AddColumn<decimal>(
          name: "YomaRewardCumulative",
          schema: "Opportunity",
          table: "Opportunity",
          type: "numeric(12,2)",
          nullable: true);

      migrationBuilder.AddColumn<decimal>(
          name: "YomaRewardPool",
          schema: "Opportunity",
          table: "Opportunity",
          type: "numeric(12,2)",
          nullable: true);

      migrationBuilder.AddColumn<decimal>(
          name: "YomaReward",
          schema: "Opportunity",
          table: "MyOpportunity",
          type: "numeric(8,2)",
          nullable: true);

      migrationBuilder.CreateIndex(
          name: "IX_MyOpportunity_VerificationStatusId_DateStart_DateEnd_DateCo~",
          schema: "Opportunity",
          table: "MyOpportunity",
          columns: ["VerificationStatusId", "DateStart", "DateEnd", "DateCompleted", "ZltoReward", "YomaReward", "Recommendable", "StarRating", "DateCreated", "DateModified"]);
      ApplicationDb_Remove_Reward_Yoma_Seeding.SeedDown(migrationBuilder);
    }
  }
}
