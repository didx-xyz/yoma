using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Services
{
  public sealed class CustomFieldDefinitionService : ICustomFieldDefinitionService
  {
    #region Class Variables
    private readonly IRepositoryWithNavigation<CustomFieldDefinition> _customFieldDefinitionRepository;
    #endregion

    #region Constructor
    public CustomFieldDefinitionService(IRepositoryWithNavigation<CustomFieldDefinition> customFieldDefinitionRepository)
    {
      _customFieldDefinitionRepository = customFieldDefinitionRepository ?? throw new ArgumentNullException(nameof(customFieldDefinitionRepository));
    }
    #endregion

    #region Public Members
    public List<CustomFieldDefinition> List(CustomFieldEntityType entityType, string? entityContext, bool includeChildItems, bool activeOnly)
    {
      entityContext = entityContext?.Trim();
      if (string.IsNullOrEmpty(entityContext)) entityContext = null;

      var entityTypeValue = entityType.ToString();

      var query = _customFieldDefinitionRepository.Query(includeChildItems)
        .Where(o => o.EntityType == entityTypeValue
          && (o.EntityContext == null || o.EntityContext == entityContext));

      if (activeOnly)
        query = query.Where(o => o.IsActive);

      var result = query
        .OrderBy(o => o.Group)
        .ThenBy(o => o.SubGroup)
        .ThenBy(o => o.SortOrder)
        .ThenBy(o => o.Title)
        .ToList();

      if (includeChildItems && activeOnly)
      {
        foreach (var item in result.Where(o => o.Options != null))
          item.Options = item.Options?.Where(o => o.IsActive).ToList();
      }

      return result;
    }
    #endregion
  }
}

