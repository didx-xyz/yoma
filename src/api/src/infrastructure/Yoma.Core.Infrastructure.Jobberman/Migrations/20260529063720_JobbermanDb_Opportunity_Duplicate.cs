using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Jobberman.Migrations
{
  /// <inheritdoc />
  public partial class JobbermanDb_Opportunity_Duplicate : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AddColumn<bool>(
          name: "Duplicate",
          schema: "Jobberman",
          table: "Opportunity",
          type: "boolean",
          nullable: true);

      migrationBuilder.Sql("""
        UPDATE "Jobberman"."Opportunity" AS opportunity
        SET "Title" =
          CASE
            WHEN length(normalized."Title") > 150 THEN left(normalized."Title", 147) || '...'
            ELSE normalized."Title"
          END
        FROM (
          SELECT
            "Id",
            btrim(regexp_replace("Title", '[[:space:]]+', ' ', 'g')) AS "Title"
          FROM "Jobberman"."Opportunity"
          WHERE "Title" IS NOT NULL
        ) AS normalized
        WHERE opportunity."Id" = normalized."Id";
        """);

      migrationBuilder.Sql("""
        WITH ranked AS (
          SELECT
            "Id",
            row_number() OVER (
              PARTITION BY "CountryCodeAlpha2", lower("Title")
              ORDER BY "ExternalId"
            ) AS "Rank"
          FROM "Jobberman"."Opportunity"
          WHERE NULLIF(btrim("Title"), '') IS NOT NULL
        )
        UPDATE "Jobberman"."Opportunity" AS opportunity
        SET "Duplicate" = true
        FROM ranked
        WHERE opportunity."Id" = ranked."Id"
          AND ranked."Rank" > 1;
        """);

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_CountryCodeAlpha2_Title",
          schema: "Jobberman",
          table: "Opportunity",
          columns: ["CountryCodeAlpha2", "Title"]);

      migrationBuilder.CreateIndex(
          name: "IX_Opportunity_Duplicate_Deleted_DateCreated_DateModified",
          schema: "Jobberman",
          table: "Opportunity",
          columns: ["Duplicate", "Deleted", "DateCreated", "DateModified"]);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_Opportunity_CountryCodeAlpha2_Title",
          schema: "Jobberman",
          table: "Opportunity");

      migrationBuilder.DropIndex(
          name: "IX_Opportunity_Duplicate_Deleted_DateCreated_DateModified",
          schema: "Jobberman",
          table: "Opportunity");

      migrationBuilder.DropColumn(
          name: "Duplicate",
          schema: "Jobberman",
          table: "Opportunity");
    }
  }
}
