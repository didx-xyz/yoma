using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  public partial class ApplicationDb_UserPreference_EngagementTypes : Migration
  {
    #region Class Variables
    private static readonly string[] SelectionColumns = ["UserId", "EngagementTypeId"];
    #endregion

    #region Public Members
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      #region Entity
      migrationBuilder.CreateTable(
        name: "UserPreferenceEngagementTypes",
        schema: "Entity",
        columns: table => new
        {
          Id = table.Column<Guid>(type: "uuid", nullable: false),
          UserId = table.Column<Guid>(type: "uuid", nullable: false),
          EngagementTypeId = table.Column<Guid>(type: "uuid", nullable: false),
          DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
        },
        constraints: table =>
        {
          table.PrimaryKey("PK_UserPreferenceEngagementTypes", x => x.Id);

          table.ForeignKey(
            name: "FK_UserPreferenceEngagementTypes_EngagementType_EngagementType~",
            column: x => x.EngagementTypeId,
            principalSchema: "Lookup",
            principalTable: "EngagementType",
            principalColumn: "Id",
            onDelete: ReferentialAction.NoAction);

          table.ForeignKey(
            name: "FK_UserPreferenceEngagementTypes_UserPreferences_UserId",
            column: x => x.UserId,
            principalSchema: "Entity",
            principalTable: "UserPreferences",
            principalColumn: "UserId",
            onDelete: ReferentialAction.NoAction);
        });

      migrationBuilder.CreateIndex(
        name: "IX_UserPreferenceEngagementTypes_EngagementTypeId",
        schema: "Entity",
        table: "UserPreferenceEngagementTypes",
        column: "EngagementTypeId");

      migrationBuilder.CreateIndex(
        name: "IX_UserPreferenceEngagementTypes_UserId_EngagementTypeId",
        schema: "Entity",
        table: "UserPreferenceEngagementTypes",
        columns: SelectionColumns,
        unique: true);

      // Preserve each previous single selection before removing its source column.
      // Users who have never selected an engagement type receive no invented preference.
      migrationBuilder.Sql("""
        INSERT INTO "Entity"."UserPreferenceEngagementTypes"
          ("Id", "UserId", "EngagementTypeId", "DateCreated")
        SELECT
          gen_random_uuid(),
          "UserId",
          "EngagementTypeId",
          "DateCreated"
        FROM "Entity"."UserPreferences"
        WHERE "EngagementTypeId" IS NOT NULL;
        """);

      migrationBuilder.DropForeignKey(
        name: "FK_UserPreferences_EngagementType_EngagementTypeId",
        schema: "Entity",
        table: "UserPreferences");

      migrationBuilder.DropIndex(
        name: "IX_UserPreferences_EngagementTypeId",
        schema: "Entity",
        table: "UserPreferences");

      migrationBuilder.DropColumn(
        name: "EngagementTypeId",
        schema: "Entity",
        table: "UserPreferences");
      #endregion Entity
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      throw new NotSupportedException("This migration cannot be reversed without losing preference selections.");
    }
    #endregion
  }
}
