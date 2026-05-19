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
