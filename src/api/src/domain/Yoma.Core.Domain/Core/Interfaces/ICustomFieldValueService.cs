using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface ICustomFieldValueService
  {
    void Validate(CustomFieldEntityType entityType, string? entityContext, List<CustomFieldValueRequest>? customFields, CustomFieldUpsertMode mode);

    List<CustomFieldValueRequest>? ParseCSVValues(CustomFieldEntityType entityType, string? entityContext, IReadOnlyDictionary<string, string?>? values);

    void ValidateAndHydrateFilters(CustomFieldEntityType entityType, List<CustomFieldFilter>? filters);

    /// <summary>
    /// Resolves a persisted custom-field value to stable human-readable values for external representations
    /// such as credentials. Inline option keys and lookup identifiers are converted to their display names.
    /// </summary>
    List<string> ResolveDisplayValues(CustomFieldDefinition definition, CustomFieldValueItem item);

    Task<List<CustomFieldValueItem>?> Upsert(CustomFieldEntityType entityType, string? entityContext, string? entityContextPrevious, Guid? opportunityId, Guid? myOpportunityId, List<CustomFieldValueRequest>? customFields, CustomFieldUpsertMode mode);

    Task Delete(CustomFieldEntityType entityType, Guid entityId);
  }
}
