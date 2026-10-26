using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Test.Core.Fixtures
{
  internal static partial class CustomFieldFixtureData
  {
    private static List<CustomFieldDefinition> OpportunityLearning() =>
    [
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "Learning",
        Key = "LearningDifficulty",
        Title = "Difficulty",
        Group = "Requirements",
        DataType = CustomFieldDataType.Option,
        IsRequired = true,
        SortOrder = 10,
        IsActive = true,
        IsSystem = true,
        Options = [
          Option("Beginner", "Beginner", 10),
          Option("Intermediate", "Intermediate", 20),
          Option("Advanced", "Advanced", 30),
          Option("AnyLevel", "Any level", 40)
        ]
      }
    ];
  }
}
