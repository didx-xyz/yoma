using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Opportunity;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class ApplicationDb_CF_Configuration_Seeding_Difficulty
  {
    #region Class Variables
    private static readonly string[] DefinitionColumns =
    [
      "Id", "EntityType", "EntityContext", "Key", "Title", "Group", "SubGroup",
      "DataType", "IsRequired", "SupportsMultiple", "SortOrder", "IsActive",
      "IsSystem", "IsSchemaMapped", "DateCreated", "DateModified"
    ];

    private static readonly string[] OptionColumns =
    [
      "Id", "CustomFieldDefinitionId", "Key", "Name", "SortOrder",
      "IsActive", "DateCreated", "DateModified"
    ];
    #endregion

    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Opportunity
      #region Custom Fields
      var created = new DateTimeOffset(2026, 9, 29, 0, 0, 0, TimeSpan.Zero);

      // Protect the four non-Job contracts used by partner mappings and the temporary SSI bridge.
      // Job experience has no runtime dependency: it remains ordinary configurable metadata.
      // Group by opportunity type; Requirements holds readiness/qualifications, not eligibility gates.
      // Sort in increments of ten to leave room for the next approved CFs and options.
      // Required applies to manual capture; CSV and partner sync use PatchAllowMissingRequired.
      migrationBuilder.InsertData(
        schema: "Core",
        table: "CustomFieldDefinition",
        columns: DefinitionColumns,
        values: new object[,]
        {
          {
            new Guid("d1ff1c01-9b29-4cf0-a100-000000000001"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Learning.ToString(),
            CustomFieldConstants.Difficulty.Keys.Learning, "Difficulty", "Learning details", "Requirements",
            CustomFieldDataType.Option.ToString(), true, false, 10,
            true, true, false, created, created
          },
          {
            new Guid("d1ff1c01-9b29-4cf0-a100-000000000002"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Other.ToString(),
            CustomFieldConstants.Difficulty.Keys.Other, "Difficulty", "Other details", "Requirements",
            CustomFieldDataType.Option.ToString(), true, false, 10,
            true, true, false, created, created
          },
          {
            new Guid("d1ff1c01-9b29-4cf0-a100-000000000003"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.ImpactAction.ToString(),
            CustomFieldConstants.Difficulty.Keys.ImpactAction, "Difficulty", "Impact action details", "Requirements",
            CustomFieldDataType.Option.ToString(), true, false, 10,
            true, true, false, created, created
          },
          {
            new Guid("d1ff1c01-9b29-4cf0-a100-000000000004"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Event.ToString(),
            CustomFieldConstants.Difficulty.Keys.Event, "Difficulty", "Event details", "Requirements",
            CustomFieldDataType.Option.ToString(), true, false, 10,
            true, true, false, created, created
          },
          {
            new Guid("d1ff1c01-9b29-4cf0-a100-000000000005"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Job.ToString(),
            "jobExperienceLevel", "Experience level", "Job details", "Requirements",
            CustomFieldDataType.Option.ToString(), true, false, 10,
            true, false, false, created, created
          }
        });

      migrationBuilder.InsertData(
        schema: "Core",
        table: "CustomFieldOption",
        columns: OptionColumns,
        values: new object[,]
        {
          { new Guid("d1ff1c01-9b29-4cf0-a100-000000000101"), new Guid("d1ff1c01-9b29-4cf0-a100-000000000001"), CustomFieldConstants.Difficulty.Options.Beginner, "Beginner", 10, true, created, created },
          { new Guid("d1ff1c01-9b29-4cf0-a100-000000000102"), new Guid("d1ff1c01-9b29-4cf0-a100-000000000001"), CustomFieldConstants.Difficulty.Options.Intermediate, "Intermediate", 20, true, created, created },
          { new Guid("d1ff1c01-9b29-4cf0-a100-000000000103"), new Guid("d1ff1c01-9b29-4cf0-a100-000000000001"), CustomFieldConstants.Difficulty.Options.Advanced, "Advanced", 30, true, created, created },
          { new Guid("d1ff1c01-9b29-4cf0-a100-000000000104"), new Guid("d1ff1c01-9b29-4cf0-a100-000000000001"), Difficulty.AnyLevel.ToString(), Difficulty.AnyLevel.ToDescription(), 40, true, created, created },
          { new Guid("d1ff1c01-9b29-4cf0-a100-000000000105"), new Guid("d1ff1c01-9b29-4cf0-a100-000000000002"), CustomFieldConstants.Difficulty.Options.Beginner, "Beginner", 10, true, created, created },
          { new Guid("d1ff1c01-9b29-4cf0-a100-000000000106"), new Guid("d1ff1c01-9b29-4cf0-a100-000000000002"), CustomFieldConstants.Difficulty.Options.Intermediate, "Intermediate", 20, true, created, created },
          { new Guid("d1ff1c01-9b29-4cf0-a100-000000000107"), new Guid("d1ff1c01-9b29-4cf0-a100-000000000002"), CustomFieldConstants.Difficulty.Options.Advanced, "Advanced", 30, true, created, created },
          { new Guid("d1ff1c01-9b29-4cf0-a100-000000000108"), new Guid("d1ff1c01-9b29-4cf0-a100-000000000002"), Difficulty.AnyLevel.ToString(), Difficulty.AnyLevel.ToDescription(), 40, true, created, created },
          { new Guid("d1ff1c01-9b29-4cf0-a100-000000000109"), new Guid("d1ff1c01-9b29-4cf0-a100-000000000003"), CustomFieldConstants.Difficulty.Options.EntryLevel, "Entry level", 10, true, created, created },
          { new Guid("d1ff1c01-9b29-4cf0-a100-000000000110"), new Guid("d1ff1c01-9b29-4cf0-a100-000000000003"), CustomFieldConstants.Difficulty.Options.ExperienceNeeded, "Experience needed", 20, true, created, created },
          { new Guid("d1ff1c01-9b29-4cf0-a100-000000000111"), new Guid("d1ff1c01-9b29-4cf0-a100-000000000003"), CustomFieldConstants.Difficulty.Options.SkillsRequired, "Skills required", 30, true, created, created },
          { new Guid("d1ff1c01-9b29-4cf0-a100-000000000112"), new Guid("d1ff1c01-9b29-4cf0-a100-000000000004"), CustomFieldConstants.Difficulty.Options.OpenToAll, "Open to all", 10, true, created, created },
          { new Guid("d1ff1c01-9b29-4cf0-a100-000000000113"), new Guid("d1ff1c01-9b29-4cf0-a100-000000000004"), CustomFieldConstants.Difficulty.Options.FamiliarityNeeded, "Familiarity needed", 20, true, created, created },
          { new Guid("d1ff1c01-9b29-4cf0-a100-000000000114"), new Guid("d1ff1c01-9b29-4cf0-a100-000000000004"), CustomFieldConstants.Difficulty.Options.ExperiencedIndividuals, "Experienced individuals", 30, true, created, created },
          { new Guid("d1ff1c01-9b29-4cf0-a100-000000000115"), new Guid("d1ff1c01-9b29-4cf0-a100-000000000005"), "None", "None (No previous experience required)", 10, true, created, created },
          { new Guid("d1ff1c01-9b29-4cf0-a100-000000000116"), new Guid("d1ff1c01-9b29-4cf0-a100-000000000005"), "EntryJunior", "Entry / Junior (1–3 years)", 20, true, created, created },
          { new Guid("d1ff1c01-9b29-4cf0-a100-000000000117"), new Guid("d1ff1c01-9b29-4cf0-a100-000000000005"), "Mid", "Mid (4–6 years)", 30, true, created, created },
          { new Guid("d1ff1c01-9b29-4cf0-a100-000000000118"), new Guid("d1ff1c01-9b29-4cf0-a100-000000000005"), "Senior", "Senior (7+ years)", 40, true, created, created }
        });
      #endregion

      #region Existing Values
      // Preserve non-Job difficulty using the approved type-specific mapping.
      // Job difficulty never represented years of experience; leave its new field unspecified.
      // Existing credentials are immutable. The hidden domain projection keeps current issuance
      // working until the final CF/SSI schema rework removes the legacy property mapping.
      migrationBuilder.Sql($"""
        INSERT INTO "Core"."CustomFieldValue"
          ("Id", "CustomFieldDefinitionId", "OpportunityId", "Value", "DateCreated", "DateModified")
        SELECT gen_random_uuid(), definition."Id", opportunity."Id",
          CASE
            WHEN type."Name" = '{Domain.Opportunity.Type.ImpactAction}' THEN
              CASE difficulty."Name"
                WHEN 'Any Level' THEN '{CustomFieldConstants.Difficulty.Options.EntryLevel}'
                WHEN '{CustomFieldConstants.Difficulty.Options.Beginner}' THEN '{CustomFieldConstants.Difficulty.Options.EntryLevel}'
                WHEN '{CustomFieldConstants.Difficulty.Options.Intermediate}' THEN '{CustomFieldConstants.Difficulty.Options.ExperienceNeeded}'
                WHEN '{CustomFieldConstants.Difficulty.Options.Advanced}' THEN '{CustomFieldConstants.Difficulty.Options.SkillsRequired}'
              END
            WHEN type."Name" = '{Domain.Opportunity.Type.Event}' THEN
              CASE difficulty."Name"
                WHEN 'Any Level' THEN '{CustomFieldConstants.Difficulty.Options.OpenToAll}'
                WHEN '{CustomFieldConstants.Difficulty.Options.Beginner}' THEN '{CustomFieldConstants.Difficulty.Options.OpenToAll}'
                WHEN '{CustomFieldConstants.Difficulty.Options.Intermediate}' THEN '{CustomFieldConstants.Difficulty.Options.FamiliarityNeeded}'
                WHEN '{CustomFieldConstants.Difficulty.Options.Advanced}' THEN '{CustomFieldConstants.Difficulty.Options.ExperiencedIndividuals}'
              END
            ELSE
              CASE difficulty."Name"
                WHEN 'Any Level' THEN '{Difficulty.AnyLevel}'
                WHEN '{CustomFieldConstants.Difficulty.Options.Beginner}' THEN '{CustomFieldConstants.Difficulty.Options.Beginner}'
                WHEN '{CustomFieldConstants.Difficulty.Options.Intermediate}' THEN '{CustomFieldConstants.Difficulty.Options.Intermediate}'
                WHEN '{CustomFieldConstants.Difficulty.Options.Advanced}' THEN '{CustomFieldConstants.Difficulty.Options.Advanced}'
              END
          END,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM "Opportunity"."Opportunity" opportunity
        JOIN "Opportunity"."OpportunityType" type ON type."Id" = opportunity."TypeId"
        JOIN "Opportunity"."OpportunityDifficulty" difficulty ON difficulty."Id" = opportunity."DifficultyId"
        JOIN "Core"."CustomFieldDefinition" definition
          ON definition."EntityType" = '{CustomFieldEntityType.Opportunity}'
          AND definition."EntityContext" = type."Name"
          AND definition."Id" IN (
            'd1ff1c01-9b29-4cf0-a100-000000000001', 'd1ff1c01-9b29-4cf0-a100-000000000002',
            'd1ff1c01-9b29-4cf0-a100-000000000003', 'd1ff1c01-9b29-4cf0-a100-000000000004'
          )
        WHERE type."Name" <> '{Domain.Opportunity.Type.Job}';
        """);
      #endregion
      #endregion
    }
  }
}
