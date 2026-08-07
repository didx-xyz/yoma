using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Services.Lookups
{
  public class SSISchemaEntityService : ISSISchemaEntityService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly ISSISchemaTypeService _ssiSchemaTypeService;
    private readonly IRepositoryWithNavigation<SSISchemaEntity> _ssiSchemaEntityRepository;
    private readonly ICustomFieldDefinitionService _customFieldDefinitionService;
    private readonly IOpportunityTypeService _opportunityTypeService;
    #endregion

    #region Constructor
    public SSISchemaEntityService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        ISSISchemaTypeService ssiSchemaTypeService,
        IRepositoryWithNavigation<SSISchemaEntity> ssiSchemaEntityRepository,
        ICustomFieldDefinitionService customFieldDefinitionService,
        IOpportunityTypeService opportunityTypeService)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _ssiSchemaTypeService = ssiSchemaTypeService;
      _ssiSchemaEntityRepository = ssiSchemaEntityRepository;
      _customFieldDefinitionService = customFieldDefinitionService;
      _opportunityTypeService = opportunityTypeService;
    }
    #endregion

    #region Public Members
    public SSISchemaEntity GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(SSISchemaEntity)} with '{id}' does not exists", nameof(id));
      return result;
    }

    public SSISchemaEntity? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return ListAll(null, false).SingleOrDefault(o => o.Id == id);
    }

    public SSISchemaEntityProperty GetByAttributeName(string attributeName)
    {
      var result = GetByAttributeNameOrNull(attributeName) ?? throw new ArgumentException($"{nameof(SSISchemaEntityProperty)} with attribute name '{attributeName}' does not exists", nameof(attributeName));
      return result;
    }

    public SSISchemaEntityProperty? GetByAttributeNameOrNull(string attributeName)
    {
      if (string.IsNullOrWhiteSpace(attributeName))
        throw new ArgumentNullException(nameof(attributeName));
      attributeName = attributeName.Trim();

      var result = ListAll(null, false)
        .SelectMany(o => o.Properties?.Where(p => string.Equals(p.AttributeName, attributeName, StringComparison.OrdinalIgnoreCase)) ?? [])
        .ToList();
      if (result.Count == 0)
        throw new ArgumentException($"{nameof(SSISchemaEntityProperty)} not found with attribute name '{attributeName}'", nameof(attributeName));

      if (result.Count > 1)
        throw new DataInconsistencyException($"More than one {nameof(SSISchemaEntityProperty)} found with attribute name '{attributeName}'");

      return result.SingleOrDefault();
    }

    /// <summary>
    /// Indicates whether the attribute exists as a static schema entity property or custom field in any type context.
    /// This is the broad existence check used by request validation; schema creation and update subsequently validate that
    /// the attribute is active and applicable to the selected schema type and type context.
    /// </summary>
    public bool AttributeExists(string attributeName)
    {
      if (string.IsNullOrWhiteSpace(attributeName)) return false;
      attributeName = attributeName.Trim();

      return ListAll(null, false).Any(entity =>
        entity.Properties?.Any(property =>
          string.Equals(property.AttributeName, attributeName, StringComparison.OrdinalIgnoreCase)) == true ||
        entity.CustomFields?.Any(customField =>
          string.Equals(customField.AttributeName, attributeName, StringComparison.OrdinalIgnoreCase)) == true);
    }

    /// <summary>
    /// Indicates whether the optional type context is supported by the specified schema type.
    /// Opportunity contexts are resolved against the fixed Opportunity Type names; other schema types currently support
    /// generic schemas only.
    /// </summary>
    public bool TypeContextValid(SchemaType type, string? typeContext)
    {
      typeContext = typeContext?.Trim();
      if (string.IsNullOrEmpty(typeContext)) return true;

      return type switch
      {
        SchemaType.Opportunity => _opportunityTypeService.GetByNameOrNull(typeContext) != null,
        _ => false
      };
    }

    /// <summary>
    /// Lists schema entities and active custom fields applicable to the optional schema type and type context.
    /// With no context, only generic custom fields are included. With a context, generic fields and fields assigned to that
    /// context are included.
    /// </summary>
    public List<SSISchemaEntity> List(SchemaType? type, string? typeContext = null)
    {
      typeContext = typeContext?.Trim();
      if (string.IsNullOrEmpty(typeContext)) typeContext = null;

      if (type.HasValue && !TypeContextValid(type.Value, typeContext))
        throw new ArgumentException($"Type context '{typeContext}' is invalid or unsupported for schema type '{type}'", nameof(typeContext));

      var results = ListInternal(type);
      AddCustomFields(results, entityType => _customFieldDefinitionService.List(entityType, false, true, typeContext));

      return results;
    }

    /// <summary>
    /// Lists schema entities with custom fields from every type context, optionally filtered by schema type and active state.
    /// This is used internally when matching or rendering existing provider schemas because their stored attributes may belong
    /// to any supported context.
    /// </summary>
    public List<SSISchemaEntity> ListAll(SchemaType? type, bool activeOnly)
    {
      var results = ListInternal(type);
      AddCustomFields(results, entityType => _customFieldDefinitionService.ListAll(entityType, false, activeOnly));

      return results;
    }
    #endregion

    #region Private Members
    /// <summary>
    /// Creates detached results from the persisted static schema entity configuration and applies the optional schema-type filter.
    /// Dynamic custom fields are populated separately by the calling list method.
    /// </summary>
    private List<SSISchemaEntity> ListInternal(SchemaType? type)
    {
      var results = ListStatic()
        .Select(entity => new SSISchemaEntity
        {
          Id = entity.Id,
          Name = entity.Name,
          TypeName = entity.TypeName,
          Properties = entity.Properties,
          Types = entity.Types
        })
        .ToList();

      if (type != null)
      {
        var typeId = _ssiSchemaTypeService.GetByName(type.Value.ToString()).Id;
        results = [.. results.Where(o => o.Types?.Any(t => t.Id == typeId) == true)];
      }

      return results;
    }

    /// <summary>
    /// Populates each compatible schema entity with dynamic custom fields selected by the calling context strategy.
    /// </summary>
    private static void AddCustomFields(
      List<SSISchemaEntity> entities,
      Func<CustomFieldEntityType, List<CustomFieldDefinition>> listDefinitions)
    {
      foreach (var entity in entities)
      {
        if (!Enum.TryParse<CustomFieldEntityType>(entity.Name, true, out var entityType))
          continue;

        entity.CustomFields = [.. listDefinitions(entityType)
          .Select(ToCustomField)
          .OrderBy(o => o.Group)
          .ThenBy(o => o.SubGroup)
          .ThenBy(o => o.SortOrder)
          .ThenBy(o => o.NameDisplay)];
      }
    }

    private List<SSISchemaEntity> ListStatic()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(CacheItemType.Lookups))
      {
        var results = _ssiSchemaEntityRepository.Query(true).ToList();
        ReflectEntityTypeInformation(results);
        results = [.. results.OrderBy(o => o.Name)];
        results.ForEach(o => o.Properties = o.Properties?.OrderBy(p => p.NameDisplay).ToList());
        return results;
      }

      return _memoryCache.GetOrCreate(CacheHelper.GenerateKey<SSISchemaEntity>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        var entities = _ssiSchemaEntityRepository.Query(true).ToList();
        ReflectEntityTypeInformation(entities);
        entities = [.. entities.OrderBy(o => o.Name)];
        entities.ForEach(o => o.Properties = o.Properties?.OrderBy(p => p.NameDisplay).ToList());
        return entities;
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(SSISchemaEntity)}s'");
    }

    private static SSISchemaEntityCustomField ToCustomField(CustomFieldDefinition definition)
    {
      return new SSISchemaEntityCustomField
      {
        Id = definition.Id,
        Key = definition.Key,
        NameDisplay = definition.Title,
        Description = definition.Description,
        AttributeName = $"{definition.EntityType}_{definition.Key}",
        TypeName = ToTypeName(definition),
        TypeContext = definition.EntityContext,
        DataType = definition.DataType,
        LookupType = definition.LookupType,
        SupportsMultiple = definition.SupportsMultiple,
        Group = definition.Group,
        SubGroup = definition.SubGroup,
        SortOrder = definition.SortOrder,
        Required = definition.IsRequired,
        IsActive = definition.IsActive,
        IsSystem = definition.IsSystem,
        IsSchemaMapped = definition.IsSchemaMapped
      };
    }

    private static string ToTypeName(CustomFieldDefinition definition)
    {
      return definition.DataType switch
      {
        CustomFieldDataType.String => nameof(String),
        CustomFieldDataType.Integer => nameof(Int32),
        CustomFieldDataType.Decimal => nameof(Decimal),
        CustomFieldDataType.Boolean => nameof(Boolean),
        CustomFieldDataType.DateTime => nameof(DateTimeOffset),
        CustomFieldDataType.Option when definition.SupportsMultiple == true => $"List<{nameof(String)}>",
        CustomFieldDataType.Option => nameof(String),
        _ => throw new InvalidOperationException($"Custom field data type '{definition.DataType}' is not supported by credential schema discovery")
      };
    }

    private static void ReflectEntityTypeInformation(List<SSISchemaEntity>? entities)
    {
      if (entities == null || entities.Count == 0) return;

      foreach (var entity in entities)
      {
        var typeInfo = Type.GetType(entity.TypeName, false, true) ?? throw new InvalidOperationException($"Type not found with name '{entity.TypeName}' for entity '{entity.Name}'");

        entity.Name = typeInfo.Name;

        if (entity.Properties == null) continue;

        foreach (var prop in entity.Properties)
        {
          var propNameParts = prop.Name.Split('.', StringSplitOptions.RemoveEmptyEntries).ToList();
          if (propNameParts.Count == 0)
            throw new InvalidOperationException($"Property name is empty for entity '{entity.Name}'. At least 1 property name part required");

          if (propNameParts.Count > 2)
            throw new InvalidOperationException($"Only support multi-part property with one level deep. Property '{prop.Name}'");

          var multiPart = propNameParts.Count > 1;
          var currentType = typeInfo;
          foreach (var propName in propNameParts)
          {
            var propInfo = currentType.GetProperty(propName)
                ?? throw new InvalidOperationException($"Property '{propName}' not found for type '{entity.TypeName}' in entity '{entity.Name}'");

            if (propInfo.DeclaringType == null)
              throw new InvalidOperationException($"Property declaring type not found for property '{propName}' in entity '{entity.Name}'");

            if (multiPart)
            {
              if (!IsListType(propInfo.PropertyType, out Type? elementType))
                throw new InvalidOperationException($"With a multi-part property, only a parent of List<> is supported for property '{propName}' in entity '{entity.Name}'");

              if (elementType == null)
                throw new InvalidOperationException("ElementType expected with ListType");

              if (elementType.IsPrimitive || elementType == typeof(string) || elementType == typeof(DateTimeOffset))
                throw new InvalidOperationException($"Multi-part property only supports a non-nullable child property of type primitive, string, or DateTimeOffset for property '{propName}' in entity '{entity.Name}'");

              currentType = elementType;

              prop.TypeName = $"List<{elementType.Name}>";
              prop.DotNetType = $"{propInfo.PropertyType.GetGenericTypeDefinition().FullName}[[{{0}}]]";

              multiPart = false;
            }
            else
            {
              var propTypeDisplayName = string.Empty;
              if (Nullable.GetUnderlyingType(propInfo.PropertyType) != null)
              {
                var genericArguments = propInfo.PropertyType.GetGenericArguments();
                if (genericArguments.Length != 1)
                  throw new InvalidOperationException($"With nullable property, single generic argument expected Nullable<T> for property '{propName}' in entity '{entity.Name}'");

                propTypeDisplayName = genericArguments[0].Name;
              }
              else
                propTypeDisplayName = propInfo.PropertyType.Name;

              prop.TypeName = string.IsNullOrEmpty(prop.TypeName) ? propTypeDisplayName : string.Format(prop.TypeName, propTypeDisplayName);
              prop.DotNetType = string.IsNullOrEmpty(prop.DotNetType) ? propInfo.PropertyType.FullName : string.Format(prop.DotNetType, propInfo.PropertyType.FullName);
            }

            if (string.IsNullOrEmpty(prop.AttributeName)) prop.AttributeName += $"{propInfo.DeclaringType.Name}_{propInfo.Name}";
          }
        }
      }
    }

    private static bool IsListType(Type type, out Type? elementType)
    {
      elementType = null;
      if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(List<>))
      {
        elementType = type.GetGenericArguments()[0];
        return true;
      }
      return false;
    }
  }
  #endregion
}
