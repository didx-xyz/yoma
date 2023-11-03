using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Domain.SSI.Validators;
using FluentValidation;
using Yoma.Core.Domain.Exceptions;

namespace Yoma.Core.Domain.SSI.Services
{
    public class SSISchemaService : ISSISchemaService
    {
        #region Class Variables
        private readonly ISSIProviderClient _ssiProviderClient;
        private readonly ISSISchemaEntityService _ssiSchemaEntityService;
        private readonly ISSISchemaTypeService _ssiSchemaTypeService;
        private readonly SchemaRequestValidatorCreate _schemaRequestValidatorCreate;
        private readonly SchemaRequestValidatorUpdate _schemaRequestValidatorUpdate;

        public static readonly char[] SchemaName_SystemCharacters = { ':' };
        public const char SchemaName_TypeDelimiter = '|';
        #endregion

        #region Constructor
        public SSISchemaService(
            ISSIProviderClientFactory ssiProviderClientFactory,
            ISSISchemaEntityService ssiSchemaEntityService,
            ISSISchemaTypeService ssiSchemaTypeService,
            SchemaRequestValidatorCreate schemaRequestValidatorCreate,
            SchemaRequestValidatorUpdate schemaRequestValidatorUpdate)
        {
            _ssiProviderClient = ssiProviderClientFactory.CreateClient();
            _ssiSchemaEntityService = ssiSchemaEntityService;
            _ssiSchemaTypeService = ssiSchemaTypeService;
            _schemaRequestValidatorCreate = schemaRequestValidatorCreate;
            _schemaRequestValidatorUpdate = schemaRequestValidatorUpdate;
        }
        #endregion

        #region Public Members
        public async Task<SSISchema> GetByFullName(string fullName)
        {
            var schema = await _ssiProviderClient.GetSchemaByName(fullName);
            return ConvertToSSISchema(schema);
        }

        public async Task<SSISchema?> GetByFullNameOrNull(string fullName)
        {
            var schema = await _ssiProviderClient.GetSchemaByNameOrNull(fullName);
            if (schema == null) return null;
            return ConvertToSSISchema(schema);
        }

        public async Task<List<SSISchema>> List(SchemaType? type)
        {
            var schemas = await _ssiProviderClient.ListSchemas(true);

            var results = new List<SSISchema>();

            //no configured schemas found 
            if (schemas == null || !schemas.Any()) return results;

            var matchedEntitiesGrouped = _ssiSchemaEntityService.List(null)
                .SelectMany(entity => schemas
                .Where(schema => schema.AttributeNames
                    .Any(attributeName => entity.Properties?.Any(property =>
                        string.Equals(property.AttributeName, attributeName, StringComparison.InvariantCultureIgnoreCase)
                    ) == true
                ))
                .Select(schema => new
                {
                    SchemaId = schema.Id,
                    Entity = entity,
                    MatchedProperties = entity.Properties?
                        .Where(property => schema.AttributeNames
                            .Contains(property.AttributeName, StringComparer.InvariantCultureIgnoreCase))
                        .ToList() ?? new List<SSISchemaEntityProperty>()
                })
                )
                .GroupBy(item => item.SchemaId, item => new SSISchemaEntity
                {
                    Id = item.Entity.Id,
                    Name = item.Entity.Name,
                    TypeName = item.Entity.TypeName,
                    Properties = item.MatchedProperties
                })
                .ToDictionary(group => group.Key, group => group.ToList());

            // No matches found for schema attributes that match entities
            if (matchedEntitiesGrouped == null || !matchedEntitiesGrouped.Any()) return results;

            //TODO: Remove; skip schemas not created via Yoma
            schemas = schemas.Where(o => o.Name.Split(SchemaName_TypeDelimiter).Length == 2).ToList();

            results = schemas.Where(o => matchedEntitiesGrouped.ContainsKey(o.Id)).Select(o =>
                ConvertToSSISchema(o, matchedEntitiesGrouped.TryGetValue(o.Id, out var entities) ? entities : null)).ToList();

            var mismatchedSchemas = results.Where(o => o.Entities?.Any(e => !e.Types?.Any(t => t?.Type == o.Type) == true) == true).ToList();
            if (mismatchedSchemas != null && mismatchedSchemas.Any())
                throw new DataInconsistencyException($"Schema(s) '{string.Join(", ", mismatchedSchemas.Select(o => $"{o.Name}|{o.Type}"))}': Schema type vs entity schema type mismatches detected");

            if (type == null) return results;

            results = results.Where(o => o.Type == type).ToList();
            return results;
        }

        public async Task<List<SSISchema>> List(Guid? typeId)
        {
            var schemaType = typeId == null ? (SchemaType?)null : Enum.Parse<SchemaType>(_ssiSchemaTypeService.GetById(typeId.Value).Name, true);
            return await List(schemaType);
        }

        public async Task<SSISchema> Update(SSISchemaRequestUpdate request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _schemaRequestValidatorUpdate.ValidateAndThrowAsync(request);

            var schemaExisting = await GetByFullNameOrNull(request.Name)
                ?? throw new ValidationException($"Schema '{request.Name}' does not exist");

            var mismatchedEntities = _ssiSchemaEntityService.List(null)
              .Where(entity => !entity.Types?.Any(t => t?.Id == schemaExisting.TypeId) == true &&
                  entity.Properties?.Any(property => request.Attributes.Contains(property.AttributeName, StringComparer.InvariantCultureIgnoreCase)) == true
              ).ToList();
            if (mismatchedEntities != null && mismatchedEntities.Any())
                throw new ArgumentException($"Request contains attributes mapped to entities ('{string.Join(", ", mismatchedEntities.Select(o => o.Name))}') that are not of the specified schema type", nameof(request));

            var schema = await _ssiProviderClient.UpsertSchema(new SchemaRequest
            {
                Name = request.Name,
                ArtifactType = schemaExisting.ArtifactType,
                Attributes = request.Attributes
            });

            return ConvertToSSISchema(schema);
        }

        public async Task<SSISchema> Create(SSISchemaRequestCreate request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _schemaRequestValidatorCreate.ValidateAndThrowAsync(request);

            var schemaType = _ssiSchemaTypeService.GetById(request.TypeId);
            var nameFull = ToFullName(schemaType.Type, request.Name);

            if (await GetByFullNameOrNull(nameFull) != null)
                throw new ValidationException($"Schema '{nameFull}' already exists");

            if (!schemaType.SupportMultiple)
            {
                var existing = await List(schemaType.Id);
                if (existing.Any())
                    throw new ValidationException($"Schema type '{schemaType.Name}' does not support multiple schemas. Existing schemas: '{string.Join(", ", existing.Select(o => o.Name))}'");
            }

            var mismatchedEntities = _ssiSchemaEntityService.List(null)
             .Where(entity => !entity.Types?.Any(t => t?.Id == request.TypeId) == true &&
                 entity.Properties?.Any(property => request.Attributes.Contains(property.AttributeName, StringComparer.InvariantCultureIgnoreCase)) == true
             ).ToList();
            if (mismatchedEntities != null && mismatchedEntities.Any())
                throw new ArgumentException($"Request contains attributes mapped to entities ('{string.Join(", ", mismatchedEntities.Select(o => o.Name))}') that are not of the specified schema type", nameof(request));

            var schema = await _ssiProviderClient.UpsertSchema(new SchemaRequest
            {
                Name = nameFull,
                ArtifactType = request.ArtifactType,
                Attributes = request.Attributes
            });

            return ConvertToSSISchema(schema);
        }

        public string ToFullName(SchemaType type, string name)
        {
            var systemCharacters = SchemaName_SystemCharacters.Union(new[] { SchemaName_TypeDelimiter });

            if (systemCharacters.Any(name.Contains))
                throw new ArgumentException($"Contains system characters '{string.Join(' ', systemCharacters)}'", nameof(name)); //i.e. Opportunity|Learning

            return $"{type}{SchemaName_TypeDelimiter}{name}";
        }

        public (SSISchemaType schemaType, string displayName) SchemaFullNameValidateAndGetParts(string schemaFullName)
        {
            if (string.IsNullOrWhiteSpace(schemaFullName))
                throw new ArgumentNullException(nameof(schemaFullName));
            schemaFullName = schemaFullName.Trim();

            var nameParts = schemaFullName.Split(SchemaName_TypeDelimiter); //i.e. Opportunity|Learning
            if (nameParts.Length != 2)
                throw new ArgumentException($"Schema name of '{schemaFullName}' is invalid. Expecting [type]:[name]", nameof(schemaFullName));

            var schemaType = _ssiSchemaTypeService.GetByNameOrNull(nameParts.First());
            if (schemaType == null)
                throw new ArgumentException($"Schema full name of '{schemaFullName}' is invalid. Specified type '{nameParts.First()}' does not exist", nameof(schemaFullName));

            return (schemaType, nameParts.Last());
        }
        #endregion

        #region Private Members
        private SSISchema ConvertToSSISchema(Schema schema)
        {
            var matchedEntities = _ssiSchemaEntityService.List(null)
             .Where(entity =>
                 entity.Properties?.Any(property =>
                     schema.AttributeNames.Contains(property.AttributeName, StringComparer.InvariantCultureIgnoreCase)) == true
             )
             .Select(entity => new SSISchemaEntity
             {
                 Id = entity.Id,
                 Name = entity.Name,
                 TypeName = entity.TypeName,
                 Properties = entity.Properties?
                     .Where(property =>
                         schema.AttributeNames.Contains(property.AttributeName, StringComparer.InvariantCultureIgnoreCase))
                     .ToList() ?? new List<SSISchemaEntityProperty>()
             })
             .ToList();

            return ConvertToSSISchema(schema, matchedEntities);
        }

        private SSISchema ConvertToSSISchema(Schema schema, List<SSISchemaEntity>? matchedEntities)
        {
            var nameParts = SchemaFullNameValidateAndGetParts(schema.Name);

            var countEntityProperties = matchedEntities?.Sum(o => o.Properties?.Count);

            if (countEntityProperties != schema.AttributeNames?.Count)
                throw new DataInconsistencyException($"Schema '{schema.Name}': Attribute (count '{schema.AttributeNames?.Count}') vs entity property mismatch detected (count '{countEntityProperties}')");

            return new SSISchema
            {
                Id = schema.Id,
                Name = schema.Name,
                DisplayName = nameParts.displayName,
                TypeId = nameParts.schemaType.Id,
                Type = Enum.Parse<SchemaType>(nameParts.schemaType.Name, true),
                TypeDescription = nameParts.schemaType.Description,
                Version = schema.Version.ToString(),
                ArtifactType = schema.ArtifactType,
                Entities = matchedEntities ?? new List<SSISchemaEntity>(),
                PropertyCount = matchedEntities?.Sum(o => o.Properties?.Count)
            };
        }
        #endregion
    }
}
