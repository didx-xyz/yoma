using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_DotNet10_Upgrade : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      // .NET 10 / EF Core 10 fix:
      // EF now enforces model-level PK name uniqueness across schemas, causing drop/re-add PK
      // migrations on PostgreSQL. Renaming constraints is the correct, non-destructive way to
      // align the database with the explicit PK names defined in OnModelCreating.

      migrationBuilder.Sql("""
        ALTER TABLE "Reward"."TransactionStatus"
        RENAME CONSTRAINT "PK_TransactionStatus" TO "PK_Reward_TransactionStatus";
      """);

      migrationBuilder.Sql("""
        ALTER TABLE "Marketplace"."TransactionStatus"
        RENAME CONSTRAINT "PK_TransactionStatus" TO "PK_Marketplace_TransactionStatus";
      """);

      migrationBuilder.Sql("""
        ALTER TABLE "Referral"."Link"
        RENAME CONSTRAINT "PK_Link" TO "PK_Referral_Link";
      """);

      migrationBuilder.Sql("""
        ALTER TABLE "ActionLink"."Link"
        RENAME CONSTRAINT "PK_Link" TO "PK_ActionLink_Link";
      """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql("""
        ALTER TABLE "Reward"."TransactionStatus"
        RENAME CONSTRAINT "PK_Reward_TransactionStatus" TO "PK_TransactionStatus";
      """);

      migrationBuilder.Sql("""
        ALTER TABLE "Marketplace"."TransactionStatus"
        RENAME CONSTRAINT "PK_Marketplace_TransactionStatus" TO "PK_TransactionStatus";
      """);

      migrationBuilder.Sql("""
        ALTER TABLE "Referral"."Link"
        RENAME CONSTRAINT "PK_Referral_Link" TO "PK_Link";
      """);

      migrationBuilder.Sql("""
        ALTER TABLE "ActionLink"."Link"
        RENAME CONSTRAINT "PK_ActionLink_Link" TO "PK_Link";
      """);
    }
  }
}
