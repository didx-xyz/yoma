using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Domain.SSI.Validators;
using FluentValidation;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Exceptions;
using System.Transactions;

namespace Yoma.Core.Domain.SSI.Services
{
    public class SSISchemaService : ISSISchemaService
    {
        #region Class Variables
        private readonly ISSIProviderClient _ssiProviderClient;
        private readonly ISSISchemaEntityService _ssiSchemaEntityService;
        private readonly ISSISchemaTypeService _ssiSchemaTypeService;
        private readonly SchemaRequestValidator _schemaRequestValidator;
        private readonly IRepository<SSISchemaSchemaType> _ssiSchemaSchemaTypeRepository;
        #endregion

        #region Constructor
        public SSISchemaService(ISSIProviderClientFactory ssiProviderClientFactory,
            ISSISchemaEntityService ssiSchemaEntityService,
            ISSISchemaTypeService ssiSchemaTypeService,
            SchemaRequestValidator schemaRequestValidator,
            IRepository<SSISchemaSchemaType> ssiSchemaSchemaTypeRepository)
        {
            _ssiProviderClient = ssiProviderClientFactory.CreateClient();
            _ssiSchemaEntityService = ssiSchemaEntityService;
            _ssiSchemaTypeService = ssiSchemaTypeService;
            _schemaRequestValidator = schemaRequestValidator;
            _ssiSchemaSchemaTypeRepository = ssiSchemaSchemaTypeRepository;
        }
        #endregion

        #region Public Members
        public async Task<SSISchema> GetByName(string name)
        {
            var schema = await _ssiProviderClient.GetSchemaByName(name);
            return ConvertToSSISchema(schema, null);
        }

        public async Task<SSISchema?> GetByNameOrNull(string name)
        {
            var schema = await _ssiProviderClient.GetSchemaByNameOrNull(name);
            if (schema == null) return null;
            return ConvertToSSISchema(schema, null);
        }

        public async Task<List<SSISchema>> List(SchemaType? type)
        {
            var schemaType = type == null ? null : _ssiSchemaTypeService.GetByName(type.Value.ToString());

            var schemas = await _ssiProviderClient.ListSchemas(true);

            var results = new List<SSISchema>();

            //no configured schemas found 
            if (schemas == null || !schemas.Any()) return results;

            var matchedEntitiesGrouped = _ssiSchemaEntityService.List()
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
                    Properties = item.MatchedProperties
                })
                .ToDictionary(group => group.Key, group => group.ToList());

            // No matches found for schema attributes that match entities
            if (matchedEntitiesGrouped == null || !matchedEntitiesGrouped.Any()) return results;

            //TODO: Remove; skip schemas not mapped in Yoma
            schemas = schemas.Where(o => _ssiSchemaSchemaTypeRepository.Query().Select(o => o.SSISchemaName).ToList().Contains(o.Name)).ToList();

            results = schemas.Where(o => matchedEntitiesGrouped.ContainsKey(o.Id)).Select(o =>
                ConvertToSSISchema(o, matchedEntitiesGrouped.TryGetValue(o.Id, out var entities) ? entities : null, null)).ToList();

            if (schemaType == null) return results;

            return results.Where(o => o.TypeId == schemaType.Id).ToList();
        }

        public async Task<SSISchema> Create(SSISchemaRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _schemaRequestValidator.ValidateAndThrowAsync(request);

            var schemaType = _ssiSchemaTypeService.GetById(request.TypeId);
            var schemaTypeMapping = _ssiSchemaSchemaTypeRepository.Query().SingleOrDefault(o => o.SSISchemaName == request.Name);

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

            if (schemaTypeMapping != null && schemaTypeMapping.Id != schemaType.Id)
                throw new ValidationException(
                    $"Schema type mismatch detected. A schema can only be mapped to a single type: Mapped type '{schemaTypeMapping.SSISchemaName}' vs. requested type '{schemaType.Name}'");

            if (schemaTypeMapping == null)
            {
                schemaTypeMapping = new SSISchemaSchemaType
                {
                    SSISchemaName = request.Name,
                    SSISSchemaTypeName = schemaType.Name,
                    SSISchemaTypeDescription = schemaType.Description,
                    SSISchemaTypeId = schemaType.Id,
                };

                schemaTypeMapping = await _ssiSchemaSchemaTypeRepository.Create(schemaTypeMapping);
            }

            var schema = await _ssiProviderClient.CreateSchema(new SchemaRequest
            {
                Name = request.Name,
                ArtifactType = request.ArtifactType,
                Attributes = request.Attributes
            });

            scope.Complete();

            return ConvertToSSISchema(schema, schemaTypeMapping);
        }
        #endregion

        #region Private Members
        private SSISchema ConvertToSSISchema(Schema schema, SSISchemaSchemaType? schemaTypeMapping)
        {
            var matchedEntities = _ssiSchemaEntityService.List()
             .Where(entity =>
                 entity.Properties?.Any(property =>
                     schema.AttributeNames.Contains(property.AttributeName, StringComparer.InvariantCultureIgnoreCase)) == true
             )
             .Select(entity => new SSISchemaEntity
             {
                 Id = entity.Id,
                 Name = entity.Name,
                 Properties = entity.Properties?
                     .Where(property =>
                         schema.AttributeNames.Contains(property.AttributeName, StringComparer.InvariantCultureIgnoreCase))
                     .ToList() ?? new List<SSISchemaEntityProperty>()
             })
             .ToList();

            return ConvertToSSISchema(schema, matchedEntities, schemaTypeMapping);
        }

        private SSISchema ConvertToSSISchema(Schema schema, List<SSISchemaEntity>? matchedEntities, SSISchemaSchemaType? schemaTypeMapping)
        {
            schemaTypeMapping ??= _ssiSchemaSchemaTypeRepository.Query().SingleOrDefault(o => o.SSISchemaName == schema.Name)
                ?? throw new DataInconsistencyException($"Schema type mapping does not exists for schema with name '{schema.Name}'");

            return new SSISchema
            {
                Id = schema.Id,
                Name = schema.Name,
                TypeId = schemaTypeMapping.SSISchemaTypeId,
                Type = Enum.Parse<SchemaType>(schemaTypeMapping.SSISSchemaTypeName, true),
                TypeDescription = schemaTypeMapping.SSISchemaTypeDescription,
                Version = schema.Version.ToString(),
                ArtifactType = schema.ArtifactType,
                Entities = matchedEntities,
                PropertyCount = matchedEntities?.Sum(o => o.Properties?.Count)
            };
        }
        #endregion
    }
}
