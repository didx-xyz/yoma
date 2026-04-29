using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Jobberman.Migrations
{
  /// <inheritdoc />
  public partial class JobbermanDb_Initial : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.EnsureSchema(
          name: "Jobberman");

      migrationBuilder.CreateTable(
          name: "FeedSyncTracking",
          schema: "Jobberman",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            CountryCodeAlpha2 = table.Column<string>(type: "varchar(2)", nullable: false),
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
          name: "Opportunity",
          schema: "Jobberman",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            ExternalId = table.Column<string>(type: "varchar(50)", nullable: false),
            CountryCodeAlpha2 = table.Column<string>(type: "varchar(2)", nullable: false),
            SourceId = table.Column<string>(type: "varchar(50)", nullable: false),
            Title = table.Column<string>(type: "varchar(512)", nullable: false),
            Description = table.Column<string>(type: "text", nullable: true),
            URL = table.Column<string>(type: "varchar(2048)", nullable: true),
            ImageURL = table.Column<string>(type: "varchar(2048)", nullable: true),
            Location = table.Column<string>(type: "varchar(512)", nullable: true),
            WorkType = table.Column<string>(type: "varchar(100)", nullable: true),
            DateStart = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            DateEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            Category = table.Column<string>(type: "varchar(512)", nullable: true),
            Language = table.Column<string>(type: "varchar(100)", nullable: true),
            Deleted = table.Column<bool>(type: "boolean", nullable: true),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Opportunity", x => x.Id);
          });

      migrationBuilder.CreateIndex(
          name: "IX_FeedSyncTracking_CountryCodeAlpha2",
          schema: "Jobberman",
          table: "FeedSyncTracking",
          column: "CountryCodeAlpha2",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_CountryCodeAlpha2_SourceId",
          schema: "Jobberman",
          table: "Opportunity",
          columns: ["CountryCodeAlpha2", "SourceId"],
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_ExternalId",
          schema: "Jobberman",
          table: "Opportunity",
          column: "ExternalId",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_ExternalId_DateCreated_DateModified",
          schema: "Jobberman",
          table: "Opportunity",
          columns: ["ExternalId", "DateCreated", "DateModified"]);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
          name: "FeedSyncTracking",
          schema: "Jobberman");

      migrationBuilder.DropTable(
          name: "Opportunity",
          schema: "Jobberman");
    }
  }
}
