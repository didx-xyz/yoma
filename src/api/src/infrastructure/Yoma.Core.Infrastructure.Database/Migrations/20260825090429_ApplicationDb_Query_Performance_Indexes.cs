using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Query_Performance_Indexes : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      // EF's non-transactional migration warning is expected: CONCURRENTLY requires suppressTransaction.
      // An interrupted run may need index cleanup because these operations cannot roll back atomically.
      // Already deployed; retain the migration structure. Fresh Local/Dev databases replay it and log the warning.
      migrationBuilder.CreateIndex(
          name: "IX_User_YoIDOnboarded_DisplayName_Id",
          schema: "Entity",
          table: "User",
          columns: ["DisplayName", "Id"],
          filter: "\"ExternalId\" IS NOT NULL AND \"YoIDOnboarded\"")
          .Annotation("Npgsql:CreatedConcurrently", true);

      migrationBuilder.CreateIndex(
          name: "IX_MyOpportunity_Completed_Aggregation",
          schema: "Opportunity",
          table: "MyOpportunity",
          columns: ["ActionId", "VerificationStatusId", "OpportunityId", "DateCompleted"])
          .Annotation("Npgsql:CreatedConcurrently", true);

      migrationBuilder.Sql(
          """
                DROP INDEX CONCURRENTLY IF EXISTS "Opportunity"."IX_MyOpportunity_ActionId";
                """,
          suppressTransaction: true);

      migrationBuilder.Sql(
          """
                CREATE INDEX CONCURRENTLY "IX_WalletCreation_Username_Lower_StatusId"
                ON "Reward"."WalletCreation" (lower("Username"), "StatusId")
                INCLUDE ("UserId")
                WHERE "Username" IS NOT NULL AND "Username" <> '';
                """,
          suppressTransaction: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql(
          """
                DROP INDEX CONCURRENTLY IF EXISTS "Reward"."IX_WalletCreation_Username_Lower_StatusId";
                """,
          suppressTransaction: true);

      migrationBuilder.Sql(
          """
                DROP INDEX CONCURRENTLY IF EXISTS "Entity"."IX_User_YoIDOnboarded_DisplayName_Id";
                """,
          suppressTransaction: true);

      migrationBuilder.Sql(
          """
                DROP INDEX CONCURRENTLY IF EXISTS "Opportunity"."IX_MyOpportunity_Completed_Aggregation";
                """,
          suppressTransaction: true);

      migrationBuilder.Sql(
          """
                CREATE INDEX CONCURRENTLY "IX_MyOpportunity_ActionId"
                ON "Opportunity"."MyOpportunity" ("ActionId");
                """,
          suppressTransaction: true);
    }
  }
}
