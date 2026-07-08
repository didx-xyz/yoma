using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface ICustomFieldDefinitionService
  {
    List<CustomFieldDefinition> List(CustomFieldEntityType entityType, string? entityContext, bool includeChildItems, bool activeOnly);
  }
}
