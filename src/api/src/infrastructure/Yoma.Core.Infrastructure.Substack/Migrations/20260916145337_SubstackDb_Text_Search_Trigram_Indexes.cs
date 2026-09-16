using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Substack.Migrations
{
  public partial class SubstackDb_Text_Search_Trigram_Indexes : Migration
  {
    #region Private Members
    private static readonly (string Schema, string Table, string Column, string Name)[] Indexes =
    [
      ("Substack", "NewsArticle", "Title", "IX_NewsArticle_Title_Trgm"),
    ];
    #endregion

    #region Protected Members
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      // Provision fresh databases too; already installed is a no-op.
      migrationBuilder.AlterDatabase()
        .Annotation("Npgsql:PostgresExtension:pg_trgm", ",,");

      foreach (var index in Indexes)
      {
        // Concurrent builds commit independently. Retry rebuilds only this migration's
        // new indexes, including any invalid indexes left by an interrupted build.
        DropIndex(migrationBuilder, index.Schema, index.Name);
        migrationBuilder.Sql(
          $"CREATE INDEX CONCURRENTLY \"{index.Name}\" ON \"{index.Schema}\".\"{index.Table}\" USING gin (\"{index.Column}\" gin_trgm_ops);",
          suppressTransaction: true);
      }
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      foreach (var index in Indexes)
        DropIndex(migrationBuilder, index.Schema, index.Name);

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
