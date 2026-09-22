using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class ApplicationDb_CF_Configuration_Seeding_OpportunityCategoryMappings
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      Merge(migrationBuilder, "d0d322ab-d1d7-44b6-94e8-7b85246aa42e", "2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950");
      Merge(migrationBuilder, "1dc39a5d-e049-4cfe-b708-855fce97b86e", "fa564c1c-591a-4a6d-8294-20165da8866b");

      // Existing records without any category receive Other. Do not add Other to categorized
      // opportunities, remove an existing Other selection, or reclassify historical content.
      migrationBuilder.Sql("""
        INSERT INTO "Opportunity"."OpportunityCategories" ("Id", "OpportunityId", "CategoryId", "DateCreated")
        SELECT gen_random_uuid(), o."Id", 'b89c5e91-9cbb-4a0e-991f-f987eebf9b70'::uuid, CURRENT_TIMESTAMP
        FROM "Opportunity"."Opportunity" o
        WHERE NOT EXISTS (
          SELECT 1 FROM "Opportunity"."OpportunityCategories" c WHERE c."OpportunityId" = o."Id");

        DO $guard$
        BEGIN
          IF (SELECT COUNT(*) FROM "Opportunity"."OpportunityCategory") <> 16
             OR EXISTS (
               SELECT 1 FROM "Opportunity"."Opportunity" o
               WHERE NOT EXISTS (
                 SELECT 1 FROM "Opportunity"."OpportunityCategories" c WHERE c."OpportunityId" = o."Id")
             ) THEN
            RAISE EXCEPTION 'Category taxonomy migration postconditions failed';
          END IF;
        END $guard$;
        """);
    }

    private static void Merge(MigrationBuilder migrationBuilder, string sourceId, string targetId)
    {
      // When both categories were selected, keep the target association. Otherwise retarget the
      // source association in place, retaining its ID/DateCreated. Locks were taken by the first seeder.
      migrationBuilder.Sql($"""
        DELETE FROM "Opportunity"."OpportunityCategories" source
        USING "Opportunity"."OpportunityCategories" target
        WHERE source."CategoryId" = '{sourceId}'::uuid
          AND target."CategoryId" = '{targetId}'::uuid
          AND source."OpportunityId" = target."OpportunityId";

        UPDATE "Opportunity"."OpportunityCategories"
        SET "CategoryId" = '{targetId}'::uuid
        WHERE "CategoryId" = '{sourceId}'::uuid;

        DELETE FROM "Opportunity"."OpportunityCategory" WHERE "Id" = '{sourceId}'::uuid;
        """);
    }
  }
}

