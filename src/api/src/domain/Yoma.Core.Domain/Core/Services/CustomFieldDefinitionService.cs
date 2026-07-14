using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Services
{
  public sealed class CustomFieldDefinitionService : ICustomFieldDefinitionService
  {
    // TODO(YOM-1244):
    //
    // * Phase 1 Timeline: Started 08 Jul; Estimated Completion 29 Jul – 05 Aug (3-4 weeks estimated effort) *
    //
    // Complete the following once BA-approved requirements are available:
    // - Replace temporary Opportunity and MyOpportunity definitions and options.
    // - Confirm required and optional behaviour for the approved definitions.
    // - Implement approved User Presets directly on the core User model.
    // - Map approved User Presets to Opportunity filter criteria.
    // - Update the Opportunity Category lookup to the approved taxonomy and migrate existing mappings.
    // - Complete applicable Alison custom-field mappings.
    // - Complete applicable Jobberman custom-field mappings.
    // - Produce the final Opportunity CSV sample using approved fields.
    // - Produce the final MyOpportunity completion CSV sample using approved fields.
    // - Expose applicable custom fields to SSI credential schema source-field discovery.
    // - Confirm definition discovery for public Opportunity filters and MyOpportunity filters spanning types.
    // - Test CSV exports using custom-field filters.
    // - Complete final authorization-boundary and regression testing.
    #region Class Variables
    private readonly IRepositoryWithNavigation<CustomFieldDefinition> _customFieldDefinitionRepository;
    private readonly IMemoryCache _memoryCache;
    private readonly AppSettings _appSettings;
    #endregion

    #region Constructor
    public CustomFieldDefinitionService(
      IRepositoryWithNavigation<CustomFieldDefinition> customFieldDefinitionRepository,
      IMemoryCache memoryCache,
      IOptions<AppSettings> appSettings)
    {
      _customFieldDefinitionRepository = customFieldDefinitionRepository ?? throw new ArgumentNullException(nameof(customFieldDefinitionRepository));
      _memoryCache = memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));
      _appSettings = appSettings.Value ?? throw new ArgumentNullException(nameof(appSettings));
    }
    #endregion

    #region Public Members
    public CustomFieldDefinition GetByKey(CustomFieldEntityType entityType, string key, bool includeChildItems, bool activeOnly)
    {
      var myKey = key?.Trim();
      if (string.IsNullOrEmpty(myKey))
        throw new ArgumentNullException(nameof(key));

      var query = ListCached()
        .Where(o =>
          o.EntityType == entityType.ToString() &&
          string.Equals(o.Key, myKey, StringComparison.OrdinalIgnoreCase));

      if (activeOnly)
        query = query.Where(o => o.IsActive);

      var result = query.SingleOrDefault()
        ?? throw new EntityNotFoundException($"Active custom field definition with key '{myKey}' for entity type '{entityType}' does not exist");

      return ToResult(result, includeChildItems, activeOnly);
    }

    public List<CustomFieldDefinition> List(CustomFieldEntityType entityType, string? entityContext, bool includeChildItems, bool activeOnly)
    {
      var query = ListCached()
        .Where(o => o.EntityType == entityType.ToString()
          && (o.EntityContext == null || o.EntityContext == entityContext));

      if (activeOnly)
        query = query.Where(o => o.IsActive);

      return [.. query
        .Select(o => ToResult(o, includeChildItems, activeOnly))
        .OrderBy(o => o.Group)
        .ThenBy(o => o.SubGroup)
        .ThenBy(o => o.SortOrder)
        .ThenBy(o => o.Title)];
    }
    #endregion

    #region Private Members
    private List<CustomFieldDefinition> ListCached()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(CacheItemType.Lookups))
        return [.. Query()];

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<CustomFieldDefinition>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);

        return Query().ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(CustomFieldDefinition)}s'");

      return result;
    }

    private IQueryable<CustomFieldDefinition> Query()
    {
      return _customFieldDefinitionRepository.Query(true)
        .OrderBy(o => o.EntityType)
        .ThenBy(o => o.EntityContext)
        .ThenBy(o => o.Group)
        .ThenBy(o => o.SubGroup)
        .ThenBy(o => o.SortOrder)
        .ThenBy(o => o.Title);
    }

    private static CustomFieldDefinition ToResult(CustomFieldDefinition definition, bool includeChildItems, bool activeOnly)
    {
      if (activeOnly) ValidateConfiguration(definition);

      return new CustomFieldDefinition
      {
        Id = definition.Id,
        EntityType = definition.EntityType,
        EntityContext = definition.EntityContext,
        Key = definition.Key,
        Title = definition.Title,
        Description = definition.Description,
        DataType = definition.DataType,
        LookupType = definition.LookupType,
        IsRequired = definition.IsRequired,
        SupportsMultiple = definition.SupportsMultiple,
        Group = definition.Group,
        SubGroup = definition.SubGroup,
        SortOrder = definition.SortOrder,
        ValidationRegex = definition.ValidationRegex,
        ValidationErrorMessage = definition.ValidationErrorMessage,
        IsActive = definition.IsActive,
        IsSystem = definition.IsSystem,
        DateCreated = definition.DateCreated,
        DateModified = definition.DateModified,
        Options = ToOptions(definition, includeChildItems, activeOnly)
      };
    }

    private static List<CustomFieldOption>? ToOptions(CustomFieldDefinition definition, bool includeChildItems, bool activeOnly)
    {
      if (!includeChildItems || definition.Options == null)
        return null;

      if (activeOnly && definition.LookupType.HasValue)
        return null;

      var options = definition.Options.AsEnumerable();

      if (activeOnly)
        options = options.Where(o => o.IsActive);

      return [.. options];
    }

    private static void ValidateConfiguration(CustomFieldDefinition definition)
    {
      if (!definition.LookupType.HasValue) return;

      if (definition.DataType != CustomFieldDataType.Option)
        throw new InvalidOperationException(
          $"Custom field definition '{definition.Key}' references lookup " +
          $"'{definition.LookupType}' but is not an option field");

      if (definition.Options?.Any(o => o.IsActive) == true)
        throw new InvalidOperationException(
          $"Custom field definition '{definition.Key}' references lookup " +
          $"'{definition.LookupType}' and contains active custom options");
    }
    #endregion
  }
}
