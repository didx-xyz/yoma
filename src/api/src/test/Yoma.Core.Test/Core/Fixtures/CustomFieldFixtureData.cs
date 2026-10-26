using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Test.Core.Fixtures
{
  // Controlled domain inputs for unit tests. Fresh objects prevent cross-test mutation.
  internal static partial class CustomFieldFixtureData
  {
    internal static List<CustomFieldDefinition> CreateDefinitions()
    {
      List<CustomFieldDefinition> definitions =
      [
        .. OpportunityLearning(),
        .. OpportunityOther(),
        .. OpportunityImpactAction(),
        .. OpportunityEvent(),
        .. OpportunityJob(),
        .. OpportunityEntrepreneurship(),
        .. MyOpportunityEntrepreneurship(),
        .. MyOpportunityJob(),
        .. MyOpportunityImpactAction(),
        .. MyOpportunityEvent()
      ];

      foreach (var definition in definitions)
      {
        definition.Id = Guid.NewGuid();
        foreach (var option in definition.Options ?? [])
          option.CustomFieldDefinitionId = definition.Id;
      }

      return definitions;
    }

    private static CustomFieldOption Option(string key, string name, int sortOrder) => new()
    {
      Id = Guid.NewGuid(),
      Key = key,
      Name = name,
      SortOrder = sortOrder,
      IsActive = true
    };
  }
}
