using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Opportunity_Category_Type : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropForeignKey(
          name: "FK_Opportunity_OpportunityDifficulty_DifficultyId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropForeignKey(
          name: "FK_Opportunity_TimeInterval_CommitmentIntervalId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.AlterColumn<Guid>(
          name: "DifficultyId",
          schema: "Opportunity",
          table: "Opportunity",
          type: "uuid",
          nullable: true,
          oldClrType: typeof(Guid),
          oldType: "uuid");

      migrationBuilder.AlterColumn<Guid>(
          name: "CommitmentIntervalId",
          schema: "Opportunity",
          table: "Opportunity",
          type: "uuid",
          nullable: true,
          oldClrType: typeof(Guid),
          oldType: "uuid");

      migrationBuilder.AlterColumn<short>(
          name: "CommitmentIntervalCount",
          schema: "Opportunity",
          table: "Opportunity",
          type: "smallint",
          nullable: true,
          oldClrType: typeof(short),
          oldType: "smallint");

      migrationBuilder.AddForeignKey(
          name: "FK_Opportunity_OpportunityDifficulty_DifficultyId",
          schema: "Opportunity",
          table: "Opportunity",
          column: "DifficultyId",
          principalSchema: "Opportunity",
          principalTable: "OpportunityDifficulty",
          principalColumn: "Id");

      migrationBuilder.AddForeignKey(
          name: "FK_Opportunity_TimeInterval_CommitmentIntervalId",
          schema: "Opportunity",
          table: "Opportunity",
          column: "CommitmentIntervalId",
          principalSchema: "Lookup",
          principalTable: "TimeInterval",
          principalColumn: "Id");

      Opportunity_Category_Type_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropForeignKey(
          name: "FK_Opportunity_OpportunityDifficulty_DifficultyId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.DropForeignKey(
          name: "FK_Opportunity_TimeInterval_CommitmentIntervalId",
          schema: "Opportunity",
          table: "Opportunity");

      migrationBuilder.AlterColumn<Guid>(
          name: "DifficultyId",
          schema: "Opportunity",
          table: "Opportunity",
          type: "uuid",
          nullable: false,
          defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
          oldClrType: typeof(Guid),
          oldType: "uuid",
          oldNullable: true);

      migrationBuilder.AlterColumn<Guid>(
          name: "CommitmentIntervalId",
          schema: "Opportunity",
          table: "Opportunity",
          type: "uuid",
          nullable: false,
          defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
          oldClrType: typeof(Guid),
          oldType: "uuid",
          oldNullable: true);

      migrationBuilder.AlterColumn<short>(
          name: "CommitmentIntervalCount",
          schema: "Opportunity",
          table: "Opportunity",
          type: "smallint",
          nullable: false,
          defaultValue: (short)0,
          oldClrType: typeof(short),
          oldType: "smallint",
          oldNullable: true);

      migrationBuilder.AddForeignKey(
          name: "FK_Opportunity_OpportunityDifficulty_DifficultyId",
          schema: "Opportunity",
          table: "Opportunity",
          column: "DifficultyId",
          principalSchema: "Opportunity",
          principalTable: "OpportunityDifficulty",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);

      migrationBuilder.AddForeignKey(
          name: "FK_Opportunity_TimeInterval_CommitmentIntervalId",
          schema: "Opportunity",
          table: "Opportunity",
          column: "CommitmentIntervalId",
          principalSchema: "Lookup",
          principalTable: "TimeInterval",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);
    }
  }
}
