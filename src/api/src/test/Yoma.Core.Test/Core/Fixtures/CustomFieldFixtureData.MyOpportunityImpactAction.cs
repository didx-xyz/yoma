using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Test.Core.Fixtures
{
  internal static partial class CustomFieldFixtureData
  {
    private static List<CustomFieldDefinition> MyOpportunityImpactAction() =>
    [
      new()
      {
        EntityType = "MyOpportunity",
        EntityContext = "ImpactAction",
        Key = "ImpactActionImpactAchieved",
        Title = "Impact Achieved",
        Description = "Describe the impact achieved by this completed action, when known.",
        Group = "Completion Details",
        DataType = CustomFieldDataType.String,
        ValidationRegex = "\\A[\\s\\S]{1,1000}\\z",
        ValidationErrorMessage = "Impact achieved must be between 1 and 1000 characters.",
        SortOrder = 4,
        IsActive = true,
        Options = []
      }
    ];
  }
}
