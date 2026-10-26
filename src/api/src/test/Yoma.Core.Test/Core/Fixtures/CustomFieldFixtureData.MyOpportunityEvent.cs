using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Test.Core.Fixtures
{
  internal static partial class CustomFieldFixtureData
  {
    private static List<CustomFieldDefinition> MyOpportunityEvent() =>
    [
      new()
      {
        EntityType = "MyOpportunity",
        EntityContext = "Event",
        Key = "EventRole",
        Title = "Event Role",
        Description = "Role at the event, when known. No role is inferred from attendance.",
        Group = "Completion Details",
        DataType = CustomFieldDataType.Option,
        SortOrder = 3,
        IsActive = true,
        Options = [
          Option("Participant", "Participant", 10),
          Option("Speaker", "Speaker", 20),
          Option("Panelist", "Panelist", 30),
          Option("FacilitatorTrainer", "Facilitator / Trainer", 40),
          Option("CoOrganiser", "(Co-)organiser", 50),
          Option("Volunteer", "Volunteer", 60)
        ]
      }
    ];
  }
}
