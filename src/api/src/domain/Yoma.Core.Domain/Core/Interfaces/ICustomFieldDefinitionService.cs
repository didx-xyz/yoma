using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface ICustomFieldDefinitionService
  {
    CustomFieldDefinition GetByKey(CustomFieldEntityType entityType, string key, bool includeChildItems, bool activeOnly);

    /// <summary>
    /// Lists generic definitions and, when supplied, definitions matching the single entity context.
    /// </summary>
    List<CustomFieldDefinition> List(CustomFieldEntityType entityType, bool includeChildItems, bool activeOnly, string? entityContext = null);

    /// <summary>
    /// Lists generic definitions and definitions matching any of the supplied entity contexts.
    /// </summary>
    List<CustomFieldDefinition> ListForContexts(CustomFieldEntityType entityType, List<string>? entityContexts, bool includeChildItems, bool activeOnly);

    /// <summary>
    /// Lists definitions across every entity context, including generic definitions.
    /// </summary>
    List<CustomFieldDefinition> ListAll(CustomFieldEntityType entityType, bool includeChildItems, bool activeOnly);

    /// <summary>
    /// Persists schema-managed protection for the specified custom fields without changing the developer-controlled
    /// <see cref="CustomFieldDefinition.IsSystem"/> flag.
    /// </summary>
    Task MarkSchemaMapped(List<Guid> ids);
  }
}
