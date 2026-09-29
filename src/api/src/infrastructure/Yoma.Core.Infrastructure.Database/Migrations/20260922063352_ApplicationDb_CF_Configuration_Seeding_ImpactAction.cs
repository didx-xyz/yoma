using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Opportunity;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class ApplicationDb_CF_Configuration_Seeding_ImpactAction
  {
    #region Class Variables
    private static readonly string[] DefinitionColumns =
    [
      "Id", "EntityType", "EntityContext", "Key", "Title", "Description", "Group", "SubGroup",
      "DataType", "IsRequired", "SupportsMultiple", "ValidationRegex", "ValidationErrorMessage",
      "SortOrder", "IsActive", "IsSystem", "IsSchemaMapped", "DateCreated", "DateModified"
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

      // Difficulty already occupies Requirements position 10. Tools describe what the
      // participant needs, not what the provider supplies. Optional fields need no backfill.
      // Event is deliberately excluded; Impact Achieved belongs to MyOpportunity.
      migrationBuilder.InsertData(
        schema: "Core",
        table: "CustomFieldDefinition",
        columns: DefinitionColumns,
        values: new object[,]
        {
          {
            new Guid("cf0a0001-0929-4cf0-a100-000000000001"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.ImpactAction.ToString(),
            CustomFieldConstants.ImpactAction.Tools.Required, "Tools required", "Tools or equipment the participant needs for this action. Select Other for an unlisted requirement and describe it.",
            "Impact action details", "Requirements", CustomFieldDataType.Option.ToString(), false, true,
            null!, null!, 20, true, true, false, created, created
          },
          {
            new Guid("cf0a0001-0929-4cf0-a100-000000000002"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.ImpactAction.ToString(),
            CustomFieldConstants.ImpactAction.Tools.OtherDescription, "Other tool description", "Required only when Other is selected in Tools required. Describe the unlisted tools or equipment, up to 500 characters.",
            "Impact action details", "Requirements", CustomFieldDataType.String.ToString(), false, null!,
            @"\A[\s\S]{1,500}\z", "Other tool description must be between 1 and 500 characters.", 30, true, true, false, created, created
          },
          {
            new Guid("cf0a0001-0929-4cf0-a100-000000000003"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.ImpactAction.ToString(),
            "impactActionVerifiedActivityType", "Verified activity type", "Activity or session represented by completion. Describes the activity, not a separate credential schema or evidence of an already verified outcome.",
            "Impact action details", "Activity", CustomFieldDataType.Option.ToString(), false, false,
            null!, null!, 10, true, false, false, created, created
          }
        });

      // Code protects only the Other relationship. All ordinary tool/activity keys are
      // seed metadata; do not invent partner mappings or infer activity type from titles.
      migrationBuilder.InsertData(
        schema: "Core",
        table: "CustomFieldOption",
        columns: OptionColumns,
        values: new object[,]
        {
          { new Guid("cf0a0001-0929-4cf0-a100-000000000101"), new Guid("cf0a0001-0929-4cf0-a100-000000000001"), "Computer", "Computer", 10, true, created, created },
          { new Guid("cf0a0001-0929-4cf0-a100-000000000102"), new Guid("cf0a0001-0929-4cf0-a100-000000000001"), "Smartphone", "Smartphone", 20, true, created, created },
          { new Guid("cf0a0001-0929-4cf0-a100-000000000103"), new Guid("cf0a0001-0929-4cf0-a100-000000000001"), "Tablet", "Tablet", 30, true, created, created },
          { new Guid("cf0a0001-0929-4cf0-a100-000000000104"), new Guid("cf0a0001-0929-4cf0-a100-000000000001"), "GpsDevice", "GPS device", 40, true, created, created },
          { new Guid("cf0a0001-0929-4cf0-a100-000000000105"), new Guid("cf0a0001-0929-4cf0-a100-000000000001"), "Camera", "Camera", 50, true, created, created },
          { new Guid("cf0a0001-0929-4cf0-a100-000000000106"), new Guid("cf0a0001-0929-4cf0-a100-000000000001"), "PowerBank", "Power bank", 60, true, created, created },
          { new Guid("cf0a0001-0929-4cf0-a100-000000000107"), new Guid("cf0a0001-0929-4cf0-a100-000000000001"), "ProtectiveEquipment", "Protective equipment", 70, true, created, created },
          { new Guid("cf0a0001-0929-4cf0-a100-000000000108"), new Guid("cf0a0001-0929-4cf0-a100-000000000001"), "HandTools", "Hand tools", 80, true, created, created },
          { new Guid("cf0a0001-0929-4cf0-a100-000000000109"), new Guid("cf0a0001-0929-4cf0-a100-000000000001"), "GardeningTools", "Gardening tools", 90, true, created, created },
          { new Guid("cf0a0001-0929-4cf0-a100-000000000110"), new Guid("cf0a0001-0929-4cf0-a100-000000000001"), "CleaningEquipment", "Cleaning equipment", 100, true, created, created },
          { new Guid("cf0a0001-0929-4cf0-a100-000000000111"), new Guid("cf0a0001-0929-4cf0-a100-000000000001"), "MeasuringEquipment", "Measuring equipment", 110, true, created, created },
          { new Guid("cf0a0001-0929-4cf0-a100-000000000112"), new Guid("cf0a0001-0929-4cf0-a100-000000000001"), "Stationery", "Stationery", 120, true, created, created },
          { new Guid("cf0a0001-0929-4cf0-a100-000000000113"), new Guid("cf0a0001-0929-4cf0-a100-000000000001"), ImpactActionTool.Other.ToString(), "Other", 130, true, created, created },
          { new Guid("cf0a0001-0929-4cf0-a100-000000000201"), new Guid("cf0a0001-0929-4cf0-a100-000000000003"), "VerifiedFacilitationSession", "Verified facilitation session", 10, true, created, created },
          { new Guid("cf0a0001-0929-4cf0-a100-000000000202"), new Guid("cf0a0001-0929-4cf0-a100-000000000003"), "WaterQualityMonitoringSession", "Water quality monitoring session", 20, true, created, created },
          { new Guid("cf0a0001-0929-4cf0-a100-000000000203"), new Guid("cf0a0001-0929-4cf0-a100-000000000003"), "VerifiedInclusiveStorytelling", "Verified inclusive storytelling", 30, true, created, created }
        });
      #endregion
      #endregion
    }
  }
}
