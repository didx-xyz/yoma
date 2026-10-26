using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Test.Core.Fixtures
{
  internal static partial class CustomFieldFixtureData
  {
    private static List<CustomFieldDefinition> OpportunityImpactAction() =>
    [
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "ImpactAction",
        Key = "ImpactActionDifficulty",
        Title = "Difficulty",
        Group = "Requirements",
        DataType = CustomFieldDataType.Option,
        IsRequired = true,
        SortOrder = 10,
        IsActive = true,
        IsSystem = true,
        Options = [
          Option("EntryLevel", "Entry level", 10),
          Option("ExperienceNeeded", "Experience needed", 20),
          Option("SkillsRequired", "Skills required", 30)
        ]
      },
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "ImpactAction",
        Key = "ImpactActionToolsRequired",
        Title = "Tools Required",
        Description = "Tools or equipment the participant needs for this action. Select Other for an unlisted requirement and describe it.",
        Group = "Requirements",
        DataType = CustomFieldDataType.Option,
        SupportsMultiple = true,
        SortOrder = 20,
        IsActive = true,
        IsSystem = true,
        Options = [
          Option("Computer", "Computer", 10),
          Option("Smartphone", "Smartphone", 20),
          Option("Tablet", "Tablet", 30),
          Option("GpsDevice", "GPS device", 40),
          Option("Camera", "Camera", 50),
          Option("PowerBank", "Power bank", 60),
          Option("ProtectiveEquipment", "Protective equipment", 70),
          Option("HandTools", "Hand tools", 80),
          Option("GardeningTools", "Gardening tools", 90),
          Option("CleaningEquipment", "Cleaning equipment", 100),
          Option("MeasuringEquipment", "Measuring equipment", 110),
          Option("Stationery", "Stationery", 120),
          Option("Other", "Other", 130)
        ]
      },
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "ImpactAction",
        Key = "ImpactActionToolsOtherDescription",
        Title = "Other Tool Description",
        Description = "Required only when Other is selected in Tools required. Describe the unlisted tools or equipment, up to 500 characters.",
        Group = "Requirements",
        DataType = CustomFieldDataType.String,
        ValidationRegex = "\\A[\\s\\S]{1,500}\\z",
        ValidationErrorMessage = "Other tool description must be between 1 and 500 characters.",
        SortOrder = 30,
        IsActive = true,
        IsSystem = true,
        Options = []
      },
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "ImpactAction",
        Key = "ImpactActionVerifiedActivityType",
        Title = "Verified Activity Type",
        Description = "Activity or session represented by completion. Describes the activity, not a separate credential schema or evidence of an already verified outcome.",
        Group = "Completion Details",
        DataType = CustomFieldDataType.Option,
        SortOrder = 3,
        IsActive = true,
        Options = [
          Option("VerifiedFacilitationSession", "Verified facilitation session", 10),
          Option("WaterQualityMonitoringSession", "Water quality monitoring session", 20),
          Option("VerifiedInclusiveStorytelling", "Verified inclusive storytelling", 30)
        ]
      }
    ];
  }
}
