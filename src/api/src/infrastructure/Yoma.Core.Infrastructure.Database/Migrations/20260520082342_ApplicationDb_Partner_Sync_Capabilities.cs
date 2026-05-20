using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Partner_Sync_Capabilities : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.RenameColumn(
        name: "SyncTypesEnabled",
        schema: "PartnerSync",
        table: "Partner",
        newName: "SyncCapabilities");

      migrationBuilder.RenameColumn(
        name: "ActionEnabled",
        schema: "PartnerSync",
        table: "Partner",
        newName: "ActionsEnabled");

      migrationBuilder.AlterColumn<string>(
        name: "SyncCapabilities",
        schema: "PartnerSync",
        table: "Partner",
        type: "text",
        nullable: false,
        defaultValue: "{\"Push\":{\"Opportunity\":[\"Entity\"]}}",
        oldClrType: typeof(string),
        oldType: "text",
        oldDefaultValue: "{\"Push\":[\"Opportunity\"]}");

      migrationBuilder.CreateTable(
        name: "Tracking",
        schema: "PartnerSync",
        columns: table => new
        {
          Id = table.Column<Guid>(type: "uuid", nullable: false),
          PartnerId = table.Column<Guid>(type: "uuid", nullable: false),
          SyncType = table.Column<string>(type: "varchar(25)", nullable: false),
          EntityType = table.Column<string>(type: "varchar(25)", nullable: false),
          SyncScope = table.Column<string>(type: "varchar(25)", nullable: false),
          Status = table.Column<string>(type: "varchar(25)", nullable: false),
          ItemsProcessed = table.Column<int>(type: "integer", nullable: true),
          ItemsSucceeded = table.Column<int>(type: "integer", nullable: true),
          ItemsSkipped = table.Column<int>(type: "integer", nullable: true),
          ItemsFailed = table.Column<int>(type: "integer", nullable: true),
          FailedReason = table.Column<string>(type: "text", nullable: true),
          DateStamp = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
        },
        constraints: table =>
        {
          table.PrimaryKey("PK_Tracking", x => x.Id);
          table.ForeignKey(
              name: "FK_Tracking_Partner_PartnerId",
              column: x => x.PartnerId,
              principalSchema: "PartnerSync",
              principalTable: "Partner",
              principalColumn: "Id",
              onDelete: ReferentialAction.Cascade);
        });

      migrationBuilder.CreateIndex(
          name: "IX_Tracking_PartnerId_DateStamp",
          schema: "PartnerSync",
          table: "Tracking",
          columns: ["PartnerId", "DateStamp"]);

      migrationBuilder.CreateIndex(
          name: "IX_Tracking_SyncType_EntityType_SyncScope_PartnerId_DateStamp",
          schema: "PartnerSync",
          table: "Tracking",
          columns: ["SyncType", "EntityType", "SyncScope", "PartnerId", "DateStamp"]);

      migrationBuilder.CreateIndex(
          name: "IX_Tracking_SyncType_EntityType_SyncScope_PartnerId_Status_Dat~",
          schema: "PartnerSync",
          table: "Tracking",
          columns: ["SyncType", "EntityType", "SyncScope", "PartnerId", "Status", "DateStamp"]);

      // Convert existing partner sync config from:
      //   SyncType -> EntityType[]
      // to:
      //   SyncType -> EntityType -> SyncScope[]
      //
      // Existing capabilities are migrated to the Entity scope only.
      // Partner-specific scope additions, e.g. Alison Pull/Opportunity/Verification,
      // should be handled by the follow-up seed/config migration.
      migrationBuilder.Sql("""
        UPDATE "PartnerSync"."Partner" p
        SET "SyncCapabilities" = converted."SyncCapabilities"
        FROM (
          SELECT
            p2."Id",
            jsonb_object_agg(sync_raw.sync_type, entity_map.entities)::text AS "SyncCapabilities"
          FROM "PartnerSync"."Partner" p2
          CROSS JOIN LATERAL jsonb_each(p2."SyncCapabilities"::jsonb) AS sync_raw(sync_type, entity_array)
          CROSS JOIN LATERAL (
            SELECT jsonb_object_agg(entity_items.entity_type, '["Entity"]'::jsonb) AS entities
            FROM jsonb_array_elements_text(sync_raw.entity_array) AS entity_items(entity_type)
          ) entity_map
          WHERE jsonb_typeof(sync_raw.entity_array) = 'array'
          GROUP BY p2."Id"
        ) converted
        WHERE p."Id" = converted."Id";
        """);

      ApplicationDb_Partner_Sync_Capabilities_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
        name: "Tracking",
        schema: "PartnerSync");

      migrationBuilder.Sql("""
        UPDATE "PartnerSync"."Partner" p
        SET "SyncCapabilities" = converted."SyncTypesEnabled"
        FROM (
          SELECT
            p2."Id",
            jsonb_object_agg(sync_raw.sync_type, entity_map.entity_types)::text AS "SyncTypesEnabled"
          FROM "PartnerSync"."Partner" p2
          CROSS JOIN LATERAL jsonb_each(p2."SyncCapabilities"::jsonb) AS sync_raw(sync_type, entity_map_raw)
          CROSS JOIN LATERAL (
            SELECT jsonb_agg(entity_items.entity_type) AS entity_types
            FROM jsonb_object_keys(sync_raw.entity_map_raw) AS entity_items(entity_type)
          ) entity_map
          WHERE jsonb_typeof(sync_raw.entity_map_raw) = 'object'
          GROUP BY p2."Id"
        ) converted
        WHERE p."Id" = converted."Id";
        """);

      migrationBuilder.AlterColumn<string>(
        name: "SyncCapabilities",
        schema: "PartnerSync",
        table: "Partner",
        type: "text",
        nullable: false,
        defaultValue: "{\"Push\":[\"Opportunity\"]}",
        oldClrType: typeof(string),
        oldType: "text",
        oldDefaultValue: "{\"Push\":{\"Opportunity\":[\"Entity\"]}}");

      migrationBuilder.RenameColumn(
        name: "SyncCapabilities",
        schema: "PartnerSync",
        table: "Partner",
        newName: "SyncTypesEnabled");

      migrationBuilder.RenameColumn(
        name: "ActionsEnabled",
        schema: "PartnerSync",
        table: "Partner",
        newName: "ActionEnabled");
    }
  }
}
