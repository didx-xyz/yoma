using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_MyOpportunity_Verification : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_MyOpportunity_VerificationStatusId_DateCompleted_ZltoReward~",
          schema: "Opportunity",
          table: "MyOpportunity");

      migrationBuilder.AddColumn<short>(
          name: "CommitmentIntervalCount",
          schema: "Opportunity",
          table: "MyOpportunity",
          type: "smallint",
          nullable: true);

      migrationBuilder.AddColumn<Guid>(
          name: "CommitmentIntervalId",
          schema: "Opportunity",
          table: "MyOpportunity",
          type: "uuid",
          nullable: true);

      migrationBuilder.AddColumn<string>(
          name: "Feedback",
          schema: "Opportunity",
          table: "MyOpportunity",
          type: "varchar(500)",
          nullable: true);

      migrationBuilder.AddColumn<bool>(
          name: "Recommendable",
          schema: "Opportunity",
          table: "MyOpportunity",
          type: "boolean",
          nullable: true);

      migrationBuilder.AddColumn<byte>(
          name: "StarRating",
          schema: "Opportunity",
          table: "MyOpportunity",
          type: "smallint",
          nullable: true);

      migrationBuilder.CreateIndex(
          name: "IX_MyOpportunity_CommitmentIntervalId",
          schema: "Opportunity",
          table: "MyOpportunity",
          column: "CommitmentIntervalId");

      migrationBuilder.CreateIndex(
          name: "IX_MyOpportunity_VerificationStatusId_DateStart_DateEnd_DateCo~",
          schema: "Opportunity",
          table: "MyOpportunity",
          columns: ["VerificationStatusId", "DateStart", "DateEnd", "DateCompleted", "ZltoReward", "YomaReward", "Recommendable", "StarRating", "DateCreated", "DateModified"]);

      migrationBuilder.AddForeignKey(
          name: "FK_MyOpportunity_TimeInterval_CommitmentIntervalId",
          schema: "Opportunity",
          table: "MyOpportunity",
          column: "CommitmentIntervalId",
          principalSchema: "Lookup",
          principalTable: "TimeInterval",
          principalColumn: "Id");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropForeignKey(
          name: "FK_MyOpportunity_TimeInterval_CommitmentIntervalId",
          schema: "Opportunity",
          table: "MyOpportunity");

      migrationBuilder.DropIndex(
          name: "IX_MyOpportunity_CommitmentIntervalId",
          schema: "Opportunity",
          table: "MyOpportunity");

      migrationBuilder.DropIndex(
          name: "IX_MyOpportunity_VerificationStatusId_DateStart_DateEnd_DateCo~",
          schema: "Opportunity",
          table: "MyOpportunity");

      migrationBuilder.DropColumn(
          name: "CommitmentIntervalCount",
          schema: "Opportunity",
          table: "MyOpportunity");

      migrationBuilder.DropColumn(
          name: "CommitmentIntervalId",
          schema: "Opportunity",
          table: "MyOpportunity");

      migrationBuilder.DropColumn(
          name: "Feedback",
          schema: "Opportunity",
          table: "MyOpportunity");

      migrationBuilder.DropColumn(
          name: "Recommendable",
          schema: "Opportunity",
          table: "MyOpportunity");

      migrationBuilder.DropColumn(
          name: "StarRating",
          schema: "Opportunity",
          table: "MyOpportunity");

      migrationBuilder.CreateIndex(
          name: "IX_MyOpportunity_VerificationStatusId_DateCompleted_ZltoReward~",
          schema: "Opportunity",
          table: "MyOpportunity",
          columns: new[] { "VerificationStatusId", "DateCompleted", "ZltoReward", "YomaReward", "DateCreated", "DateModified" });
    }
  }
}
