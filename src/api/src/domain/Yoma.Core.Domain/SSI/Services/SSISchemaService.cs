using FluentValidation;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.SSI.Helpers;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Domain.SSI.Validators;

namespace Yoma.Core.Domain.SSI.Services
{
  public class SSISchemaService : ISSISchemaService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly ISSIProviderClient _ssiProviderClient;
    private readonly ISSISchemaEntityService _ssiSchemaEntityService;
    private readonly ICustomFieldDefinitionService _customFieldDefinitionService;
    private readonly ISSISchemaTypeService _ssiSchemaTypeService;
    private readonly SchemaRequestValidatorCreate _schemaRequestValidatorCreate;
    private readonly SchemaRequestValidatorUpdate _schemaRequestValidatorUpdate;

    public static readonly char[] SchemaName_SystemCharacters = [':'];
    public const char SchemaName_TypeDelimiter = '|';
    public const char SchemaAttribute_Internal_Prefix = '_';
    public const string SchemaAttribute_Internal_DateIssued = "_Date_Issued";
    public const string SchemaAttribute_Internal_ReferentClient = "_Referent_Client";
    public static readonly string[] SchemaAttributes_Internal = [SchemaAttribute_Internal_DateIssued, SchemaAttribute_Internal_ReferentClient];
    #endregion

    #region Constructor
    public SSISchemaService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        ISSIProviderClientFactory ssiProviderClientFactory,
        ISSISchemaEntityService ssiSchemaEntityService,
        ICustomFieldDefinitionService customFieldDefinitionService,
        ISSISchemaTypeService ssiSchemaTypeService,
        SchemaRequestValidatorCreate schemaRequestValidatorCreate,
        SchemaRequestValidatorUpdate schemaRequestValidatorUpdate)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _ssiProviderClient = ssiProviderClientFactory.CreateClient();
      _ssiSchemaEntityService = ssiSchemaEntityService;
      _customFieldDefinitionService = customFieldDefinitionService;
      _ssiSchemaTypeService = ssiSchemaTypeService;
      _schemaRequestValidatorCreate = schemaRequestValidatorCreate;
      _schemaRequestValidatorUpdate = schemaRequestValidatorUpdate;
    }
    #endregion

    #region Public Members
    public async Task<SSISchema> GetById(string id)
    {
      var schema = (await ListCached(false)).SingleOrDefault(o => o.Id == id)
        ?? throw new EntityNotFoundException($"{nameof(Schema)} with id '{id}' does not exists");

      return schema;
    }

    public async Task<SSISchema> GetByFullName(string fullName)
    {
      var schema = (await GetByFullNameOrNull(fullName)) ?? throw new EntityNotFoundException($"{nameof(Schema)} with name '{fullName}' does not exists");
      return schema;
    }

    public async Task<SSISchema?> GetByFullNameOrNull(string fullName)
    {
      return (await ListCached(true)).SingleOrDefault(o => o.Name == fullName);
    }

    public async Task<List<SSISchema>> List(SchemaType? type, string? typeContext = null)
    {
      var results = await ListCached(true);

      if (type != null)
        results = [.. results.Where(o => o.Type == type)];

      typeContext = typeContext?.Trim();
      if (string.IsNullOrEmpty(typeContext)) return results;

      if (!type.HasValue || !_ssiSchemaEntityService.TypeContextValid(type.Value, typeContext))
        throw new ArgumentException($"Type context '{typeContext}' is invalid or unsupported for schema type '{type}'", nameof(typeContext));

      // Opportunity management may select any generic schema or one scoped to the selected Opportunity type.
      // Schemas scoped to another type are excluded; no schema is selected or substituted by this operation.
      results = [.. results.Where(o =>
        string.IsNullOrEmpty(o.TypeContext) ||
        string.Equals(o.TypeContext, typeContext, StringComparison.OrdinalIgnoreCase))];

      return results;
    }

    public async Task<List<SSISchema>> List(Guid? typeId)
    {
      var schemaType = typeId == null ? (SchemaType?)null : Enum.Parse<SchemaType>(_ssiSchemaTypeService.GetById(typeId.Value).Name, true);
      return await List(schemaType);
    }

    public async Task<SSISchema> Update(SSISchemaRequestUpdate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _schemaRequestValidatorUpdate.ValidateAndThrowAsync(request);

      var schemaExisting = await GetByFullName(request.Name);

      var schemaEntities = _ssiSchemaEntityService.List(schemaExisting.Type, schemaExisting.TypeContext);
      ValidateAttributes(request, schemaEntities);

      //prefix system attributes of not already included
      var systemProperties = schemaEntities
          .SelectMany(entity => entity.Properties?.Where(property => property.System) ?? [])
          .Where(systemProperty => !request.Attributes.Contains(systemProperty.AttributeName, StringComparer.OrdinalIgnoreCase))
          .Select(systemProperty => systemProperty.AttributeName)
          .ToList();
      request.Attributes.InsertRange(0, systemProperties);

      //prefix internal attributes
      request.Attributes.InsertRange(0, SchemaAttributes_Internal);

      var schema = await _ssiProviderClient.UpsertSchema(new SchemaRequest
      {
        Name = request.Name,
        ArtifactType = schemaExisting.ArtifactType, //preserve existing artifact store; switching of artifact stores only allowed with 'Create'
        Attributes = request.Attributes
      });

      await MarkSchemaMapped(schemaEntities, request.Attributes);
      _memoryCache.Remove(CacheHelper.GenerateKey<SSISchema>());

      return ConvertToSSISchema(schema);
    }

    public async Task<SSISchema> Create(SSISchemaRequestCreate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _schemaRequestValidatorCreate.ValidateAndThrowAsync(request);

      var schemaType = _ssiSchemaTypeService.GetById(request.TypeId);
      var typeContext = request.TypeContext?.Trim();
      var nameFull = SSISSchemaHelper.ToFullName(schemaType.Type, request.Name, typeContext);

      var existingSchema = await GetByFullNameOrNull(nameFull);
      if (existingSchema != null && existingSchema.ArtifactType == request.ArtifactType) //allow switching of artifact stores; version incrementally incremented across stores
        throw new ValidationException($"Schema '{nameFull}' already exists in artifact store '{request.ArtifactType.ToDescription()}'");

      if (!schemaType.SupportMultiple)
      {
        var existing = await List(schemaType.Id);
        if (existing.Count != 0)
          throw new ValidationException($"Schema type '{schemaType.Name}' does not support multiple schemas. Existing schemas: '{string.Join(",", existing.Select(o => o.Name))}'");
      }

      var schemaEntities = _ssiSchemaEntityService.List(schemaType.Type, typeContext);
      ValidateAttributes(request, schemaEntities);

      //prefix system attributes of not already included
      var systemProperties = schemaEntities
          .SelectMany(entity => entity.Properties?.Where(property => property.System) ?? [])
          .Where(systemProperty => !request.Attributes.Contains(systemProperty.AttributeName, StringComparer.OrdinalIgnoreCase))
          .Select(systemProperty => systemProperty.AttributeName)
          .ToList();
      request.Attributes.InsertRange(0, systemProperties);

      //prefix internal attributes
      request.Attributes.InsertRange(0, SchemaAttributes_Internal);

      var schema = await _ssiProviderClient.UpsertSchema(new SchemaRequest
      {
        Name = nameFull,
        ArtifactType = request.ArtifactType,
        Attributes = request.Attributes
      });

      await MarkSchemaMapped(schemaEntities, request.Attributes);
      _memoryCache.Remove(CacheHelper.GenerateKey<SSISchema>());

      return ConvertToSSISchema(schema);
    }

    public (SSISchemaType schemaType, string displayName, string? typeContext) SchemaFullNameValidateAndGetParts(string schemaFullName)
    {
      if (string.IsNullOrWhiteSpace(schemaFullName))
        throw new ArgumentNullException(nameof(schemaFullName));
      schemaFullName = schemaFullName.Trim();

      var nameParts = schemaFullName.Split(SchemaName_TypeDelimiter); //i.e. Opportunity|Default or Opportunity|Learning|Default
      if (nameParts.Length is < 2 or > 3 || nameParts.Any(string.IsNullOrWhiteSpace))
        throw new ArgumentException($"Schema name of '{schemaFullName}' is invalid. Expecting [type]|[name] or [type]|[typeContext]|[name]", nameof(schemaFullName));

      var schemaType = _ssiSchemaTypeService.GetByNameOrNull(nameParts.First());
      if (schemaType == null)
        throw new ArgumentException($"Schema full name of '{schemaFullName}' is invalid. Specified type '{nameParts.First()}' does not exist", nameof(schemaFullName));

      var typeContext = nameParts.Length == 3
        ? nameParts[1].Trim()
        : null;

      return (schemaType, nameParts.Last(), typeContext);
    }

    public (SSISchemaType schemaType, string displayName, string? typeContext) SchemaIdValidateAndGetParts(string schemaId)
    {
      if (string.IsNullOrWhiteSpace(schemaId))
        throw new ArgumentNullException(nameof(schemaId));
      schemaId = schemaId.Trim();

      var parts = schemaId.Split(':');
      if (parts.Length != 4)
        throw new ArgumentException($"Schema ID '{schemaId}' is invalid. Expecting [identifier]:[version]:[type|name]:[version]", nameof(schemaId));

      return SchemaFullNameValidateAndGetParts(parts[2]);
    }

    #endregion

    #region Private Members
    private async Task<List<SSISchema>> ListCached(bool latestVersion)
    {
      List<SSISchema> results;

      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        results = await ListInternal();
      else
      {
        results = await _memoryCache.GetOrCreateAsync(CacheHelper.GenerateKey<SSISchema>(), async entry =>
        {
          entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
          entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
          return await ListInternal();
        }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(SSISchema)}s'");
      }

      if (latestVersion)
      {
        results = [.. results
          .GroupBy(schema => schema.Name)
          .Select(g => g.OrderByDescending(s => s.Version).First())];
      }

      return results;
    }

    private async Task<List<SSISchema>> ListInternal()
    {
      var schemas = await _ssiProviderClient.ListSchemas(false);

      var results = new List<SSISchema>();

      //no configured schemas found 
      if (schemas == null || schemas.Count == 0) return results;

      schemas = [.. schemas.Where(o => o.Name.Split(SchemaName_TypeDelimiter).Length is 2 or 3)];
      if (schemas.Count == 0) return results;

      var schemaEntities = _ssiSchemaEntityService.ListAll(null, false);
      var matchedEntitiesGrouped = schemaEntities
          .SelectMany(entity => schemas
          .Where(schema => schema.AttributeNames.Any(attributeName => ContainsAttribute(entity, attributeName)))
          .Select(schema => new
          {
            SchemaId = schema.Id,
            Entity = entity,
            MatchedProperties = entity.Properties?
              .Where(property => schema.AttributeNames.Contains(property.AttributeName, StringComparer.OrdinalIgnoreCase))
              .ToList() ?? [],
            MatchedCustomFields = entity.CustomFields?
              .Where(customField => schema.AttributeNames.Contains(customField.AttributeName, StringComparer.OrdinalIgnoreCase))
              .ToList() ?? []
          }))
          .GroupBy(item => item.SchemaId, item => new SSISchemaEntity
          {
            Id = item.Entity.Id,
            Name = item.Entity.Name,
            TypeName = item.Entity.TypeName,
            Properties = item.MatchedProperties,
            CustomFields = item.MatchedCustomFields,
            Types = item.Entity.Types
          })
          .ToDictionary(group => group.Key, group => group.ToList());

      // No matches found for schema attributes that match entities
      if (matchedEntitiesGrouped.Count == 0) return results;

      // Provider schemas are the source of truth. Re-applying this one-way protection also self-heals the rare case where
      // provider schema creation succeeded but persisting the local protection flag failed.
      var definitionIdsMapped = matchedEntitiesGrouped.Values
        .SelectMany(entities => entities)
        .SelectMany(entity => entity.CustomFields ?? [])
        .Select(customField => customField.Id)
        .Distinct()
        .ToList();
      if (definitionIdsMapped.Count != 0)
      {
        await _customFieldDefinitionService.MarkSchemaMapped(definitionIdsMapped);

        foreach (var customField in matchedEntitiesGrouped.Values
          .SelectMany(entities => entities)
          .SelectMany(entity => entity.CustomFields ?? []))
        {
          customField.IsSchemaMapped = true;
        }
      }

      results = [.. schemas.Where(o => matchedEntitiesGrouped.ContainsKey(o.Id)).Select(o =>
          ConvertToSSISchema(o, matchedEntitiesGrouped.TryGetValue(o.Id, out var entities) ? entities : null))];

      var mismatchedSchemas = results.Where(o => o.Entities?.Any(e => !e.Types?.Any(t => t?.Type == o.Type) == true) == true).ToList();
      if (mismatchedSchemas.Count != 0)
        throw new DataInconsistencyException($"Schema(s) '{string.Join(",", mismatchedSchemas.Select(o => $"{o.Name}|{o.Type}"))}': Schema type vs entity schema type mismatches detected");

      return results;
    }

    private SSISchema ConvertToSSISchema(Schema schema)
    {
      var matchedEntities = _ssiSchemaEntityService.ListAll(null, false)
        .Where(entity => schema.AttributeNames.Any(attributeName => ContainsAttribute(entity, attributeName)))
        .Select(entity => new SSISchemaEntity
        {
          Id = entity.Id,
          Name = entity.Name,
          TypeName = entity.TypeName,
          Properties = entity.Properties?
            .Where(property => schema.AttributeNames.Contains(property.AttributeName, StringComparer.OrdinalIgnoreCase))
            .ToList() ?? [],
          CustomFields = entity.CustomFields?
            .Where(customField => schema.AttributeNames.Contains(customField.AttributeName, StringComparer.OrdinalIgnoreCase))
            .ToList() ?? [],
          Types = entity.Types
        })
        .ToList();

      return ConvertToSSISchema(schema, matchedEntities);
    }

    private SSISchema ConvertToSSISchema(Schema schema, List<SSISchemaEntity>? matchedEntities)
    {
      var (schemaType, displayName, typeContext) = SchemaFullNameValidateAndGetParts(schema.Name);

      var countEntityFields = matchedEntities?.Sum(CountFields);
      var schemaAttributeNames = schema.AttributeNames?.Except(SchemaAttributes_Internal).ToList();

      if (countEntityFields != schemaAttributeNames?.Count)
        throw new DataInconsistencyException($"Schema '{schema.Name}': Attribute (count '{schemaAttributeNames?.Count}') vs entity field mismatch detected (count '{countEntityFields}')");

      return new SSISchema
      {
        Id = schema.Id,
        Name = schema.Name,
        DisplayName = displayName,
        TypeId = schemaType.Id,
        Type = Enum.Parse<SchemaType>(schemaType.Name, true),
        TypeDescription = schemaType.Description,
        TypeContext = typeContext,
        Version = schema.Version,
        ArtifactType = schema.ArtifactType,
        Entities = matchedEntities ?? [],
        PropertyCount = matchedEntities?.Sum(CountFields)
      };
    }

    private static void ValidateAttributes(SSISchemaRequestBase request, List<SSISchemaEntity> schemaEntities)
    {
      var attributesAvailable = schemaEntities
        .SelectMany(GetAttributeNames)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);
      var attributesInvalid = request.Attributes
        .Where(attribute => !attributesAvailable.Contains(attribute))
        .ToList();

      if (attributesInvalid.Count != 0)
        throw new ArgumentException(
          $"Request contains attributes that are not available for the specified schema type and context: '{string.Join(",", attributesInvalid)}'",
          nameof(request));
    }

    /// <summary>
    /// Persists local schema-mapping protection after the schema provider upsert succeeds. The provider schema and local database
    /// cannot share a transaction, so local flags are updated in one atomic batch. Schema listing derives mappings from the provider
    /// and reapplies missing flags, self-healing if the local update exceptionally failed after the provider accepted the schema.
    /// </summary>
    private async Task MarkSchemaMapped(List<SSISchemaEntity> schemaEntities, List<string> attributeNames)
    {
      var definitionIds = schemaEntities
        .SelectMany(entity => entity.CustomFields ?? [])
        .Where(customField => attributeNames.Contains(customField.AttributeName, StringComparer.OrdinalIgnoreCase))
        .Select(customField => customField.Id)
        .Distinct()
        .ToList();

      if (definitionIds.Count != 0)
        await _customFieldDefinitionService.MarkSchemaMapped(definitionIds);
    }

    private static bool ContainsAttribute(SSISchemaEntity entity, string attributeName)
    {
      return entity.Properties?.Any(property =>
          string.Equals(property.AttributeName, attributeName, StringComparison.OrdinalIgnoreCase)) == true ||
        entity.CustomFields?.Any(customField =>
          string.Equals(customField.AttributeName, attributeName, StringComparison.OrdinalIgnoreCase)) == true;
    }

    private static IEnumerable<string> GetAttributeNames(SSISchemaEntity entity)
    {
      return (entity.Properties?.Select(property => property.AttributeName) ?? [])
        .Concat(entity.CustomFields?.Select(customField => customField.AttributeName) ?? []);
    }

    private static int CountFields(SSISchemaEntity entity)
    {
      return (entity.Properties?.Count ?? 0) + (entity.CustomFields?.Count ?? 0);
    }
    #endregion
  }
}
