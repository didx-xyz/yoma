using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  public partial class ApplicationDb_Text_Search_Trigram_Indexes : Migration
  {
    #region Private Members
    private static readonly (string Schema, string Table, string Column, string Name)[] Indexes =
    [
      ("Opportunity", "Opportunity", "Title", "IX_Opportunity_Title_Trgm"),
      ("Opportunity", "Opportunity", "Summary", "IX_Opportunity_Summary_Trgm"),
      ("Opportunity", "Opportunity", "Keywords", "IX_Opportunity_Keywords_Trgm"),
      ("Entity", "User", "Email", "IX_User_Email_Trgm"),
      ("Entity", "User", "FirstName", "IX_User_FirstName_Trgm"),
      ("Entity", "User", "Surname", "IX_User_Surname_Trgm"),
      ("Entity", "User", "DisplayName", "IX_User_DisplayName_Trgm"),
      ("Entity", "User", "PhoneNumber", "IX_User_PhoneNumber_Trgm"),
      ("Entity", "Organization", "Name", "IX_Organization_Name_Trgm"),
      ("Referral", "Program", "Name", "IX_Program_Name_Trgm"),
      ("Referral", "Program", "Summary", "IX_Program_Summary_Trgm"),
      ("Referral", "Link", "Name", "IX_Referral_Link_Name_Trgm"),
      ("Referral", "Link", "Description", "IX_Referral_Link_Description_Trgm"),
      ("ActionLink", "Link", "Name", "IX_ActionLink_Link_Name_Trgm"),
      ("ActionLink", "Link", "Description", "IX_ActionLink_Link_Description_Trgm"),
      ("Marketplace", "StoreAccessControlRule", "Name", "IX_StoreAccessControlRule_Name_Trgm"),
      ("Lookup", "Skill", "Name", "IX_Skill_Name_Trgm"),
    ];
    #endregion

    #region Protected Members
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      // Provision fresh databases too; already installed is a no-op.
      migrationBuilder.AlterDatabase()
        .Annotation("Npgsql:PostgresExtension:pg_trgm", ",,");

      foreach (var (Schema, Table, Column, Name) in Indexes)
      {
        // Concurrent builds commit independently. Retry rebuilds only this migration's
        // new indexes, including any invalid indexes left by an interrupted build.
        DropIndex(migrationBuilder, Schema, Name);
        migrationBuilder.Sql(
          $"CREATE INDEX CONCURRENTLY \"{Name}\" ON \"{Schema}\".\"{Table}\" USING gin (\"{Column}\" gin_trgm_ops);",
          suppressTransaction: true);
      }
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      foreach (var (Schema, _, _, Name) in Indexes)
        DropIndex(migrationBuilder, Schema, Name);

      // Retain the shared extension; other contexts/indexes may still use it.
    }
    #endregion

    #region Private Members
    private static void DropIndex(MigrationBuilder migrationBuilder, string schema, string name)
    {
      migrationBuilder.Sql($"DROP INDEX CONCURRENTLY IF EXISTS \"{schema}\".\"{name}\";", suppressTransaction: true);
    }
    #endregion
  }
}
