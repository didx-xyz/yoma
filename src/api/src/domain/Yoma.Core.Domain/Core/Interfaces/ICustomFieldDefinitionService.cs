using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface ICustomFieldDefinitionService
  {
    CustomFieldDefinition GetByKey(CustomFieldEntityType entityType, string key, bool includeChildItems, bool activeOnly);

    List<CustomFieldDefinition> List(CustomFieldEntityType entityType, string? entityContext, bool includeChildItems, bool activeOnly);
  }
}
