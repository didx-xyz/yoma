using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface ICustomFieldValueService
  {
    void Validate(CustomFieldEntityType entityType, string? entityContext, List<CustomFieldValueRequest>? customFields);

    void ValidateAndHydrateFilters(CustomFieldEntityType entityType, List<CustomFieldFilter>? filters);

    Task<List<CustomFieldValueItem>?> Upsert(CustomFieldEntityType entityType, string? entityContext, string? entityContextPrevious, Guid? opportunityId, Guid? myOpportunityId, List<CustomFieldValueRequest>? customFields);

    Task Delete(CustomFieldEntityType entityType, Guid entityId);
  }
}
