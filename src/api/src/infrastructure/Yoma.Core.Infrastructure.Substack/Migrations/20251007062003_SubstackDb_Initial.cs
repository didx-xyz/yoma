using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Substack.Migrations
{
  /// <inheritdoc />
  public partial class SubstackDb_Initial : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.EnsureSchema(
          name: "Substack");

      migrationBuilder.CreateTable(
          name: "FeedSyncTracking",
          schema: "Substack",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            FeedType = table.Column<string>(type: "varchar(50)", nullable: false),
            ETag = table.Column<string>(type: "varchar(512)", nullable: true),
            FeedLastModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_FeedSyncTracking", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "NewsArticle",
          schema: "Substack",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            FeedType = table.Column<string>(type: "varchar(50)", nullable: false),
            ExternalId = table.Column<string>(type: "varchar(2048)", nullable: false),
            Title = table.Column<string>(type: "varchar(512)", nullable: false),
            Description = table.Column<string>(type: "text", nullable: false),
            URL = table.Column<string>(type: "varchar(2048)", nullable: false),
            ThumbnailURL = table.Column<string>(type: "varchar(2048)", nullable: true),
            PublishedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_NewsArticle", x => x.Id);
          });

      migrationBuilder.CreateIndex(
          name: "IX_FeedSyncTracking_FeedType",
          schema: "Substack",
          table: "FeedSyncTracking",
          column: "FeedType",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_NewsArticle_Description",
          schema: "Substack",
          table: "NewsArticle",
          column: "Description")
          .Annotation("Npgsql:IndexMethod", "GIN")
          .Annotation("Npgsql:TsVectorConfig", "english");

      migrationBuilder.CreateIndex(
          name: "IX_NewsArticle_FeedType_ExternalId",
          schema: "Substack",
          table: "NewsArticle",
          columns: new[] { "FeedType", "ExternalId" },
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_NewsArticle_Title_PublishedDate_DateCreated_DateModified",
          schema: "Substack",
          table: "NewsArticle",
          columns: new[] { "Title", "PublishedDate", "DateCreated", "DateModified" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
          name: "FeedSyncTracking",
          schema: "Substack");

      migrationBuilder.DropTable(
          name: "NewsArticle",
          schema: "Substack");
    }
  }
}
