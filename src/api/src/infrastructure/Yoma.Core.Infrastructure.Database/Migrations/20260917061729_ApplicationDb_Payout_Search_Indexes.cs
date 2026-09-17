using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  public partial class ApplicationDb_Payout_Search_Indexes : Migration
  {
    private static readonly (string Schema, string Table, string Column, string Name)[] Indexes =
    [
      ("Entity", "User", "Email", "IX_User_Email_Lower_Trgm"),
      ("Entity", "User", "PhoneNumber", "IX_User_PhoneNumber_Lower_Trgm"),
      ("Entity", "User", "DisplayName", "IX_User_DisplayName_Lower_Trgm"),
      ("Payout", "Transaction", "TransactionId", "IX_Transaction_TransactionId_Lower_Trgm"),
      ("Payout", "Transaction", "ErrorReason", "IX_Transaction_ErrorReason_Lower_Trgm")
    ];

    protected override void Up(MigrationBuilder migrationBuilder)
    {
      // Payout search deliberately retains lower + literal Contains. Existing raw-column
      // trigram indexes cannot index that expression. Like the older Lower indexes, these
      // expression indexes are managed by migration SQL rather than the EF model snapshot.
      foreach (var (Schema, Table, Column, Name) in Indexes)
      {
        // Match the previous hotfix's retry-safe concurrent build convention.
        DropIndex(migrationBuilder, Schema, Name);
        migrationBuilder.Sql(
          $"CREATE INDEX CONCURRENTLY \"{Name}\" ON \"{Schema}\".\"{Table}\" USING gin (lower(\"{Column}\") gin_trgm_ops);",
          suppressTransaction: true);
      }
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      foreach (var (Schema, _, _, Name) in Indexes)
        DropIndex(migrationBuilder, Schema, Name);
      // pg_trgm was provisioned by earlier migrations and remains shared.
    }

    private static void DropIndex(MigrationBuilder migrationBuilder, string schema, string name)
    {
      migrationBuilder.Sql($"DROP INDEX CONCURRENTLY IF EXISTS \"{schema}\".\"{name}\";", suppressTransaction: true);
    }
  }
}
