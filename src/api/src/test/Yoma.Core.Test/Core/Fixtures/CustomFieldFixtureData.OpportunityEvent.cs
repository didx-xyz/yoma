using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Test.Core.Fixtures
{
  internal static partial class CustomFieldFixtureData
  {
    private static List<CustomFieldDefinition> OpportunityEvent() =>
    [
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "Event",
        Key = "EventDifficulty",
        Title = "Difficulty",
        Group = "Requirements",
        DataType = CustomFieldDataType.Option,
        IsRequired = true,
        SortOrder = 10,
        IsActive = true,
        IsSystem = true,
        Options = [
          Option("OpenToAll", "Open to all", 10),
          Option("FamiliarityNeeded", "Familiarity needed", 20),
          Option("ExperiencedIndividuals", "Experienced individuals", 30)
        ]
      }
    ];
  }
}
