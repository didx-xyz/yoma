using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Domain.SSI.Validators;
using FluentValidation;

namespace Yoma.Core.Domain.SSI.Services
{
    public class SSISchemaService : ISSISchemaService
    {
        #region Class Variables
        private readonly ISSIProviderClient _ssiProviderClient;
        private readonly ISSISchemaEntityService _ssiSchemaEntityService;
        private readonly SchemaRequestValidator _schemaRequestValidator;
        #endregion

        #region Constructor
        public SSISchemaService(ISSIProviderClientFactory ssiProviderClientFactory,
            ISSISchemaEntityService ssiSchemaEntityService,
            SchemaRequestValidator schemaRequestValidator)
        {
            _ssiProviderClient = ssiProviderClientFactory.CreateClient();
            _ssiSchemaEntityService = ssiSchemaEntityService;
            _schemaRequestValidator = schemaRequestValidator;
        }
        #endregion

        #region Public Members
        public async Task<SSISchema> GetByName(string name)
        {
            var schema = await _ssiProviderClient.GetSchemaByName(name);
            return ConvertToSSISchema(schema);
        }

        public async Task<SSISchema?> GetByNameOrNull(string name)
        {
            var schema = await _ssiProviderClient.GetSchemaByNameOrNull(name);
            if (schema == null) return null;
            return ConvertToSSISchema(schema);
        }

        public async Task<List<SSISchema>> List()
        {
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

            return schemas.Where(o => matchedEntitiesGrouped.ContainsKey(o.Id)).Select(o =>
                ConvertToSSISchema(o, matchedEntitiesGrouped.TryGetValue(o.Id, out var entities) ? entities : null)).ToList();
        }

        public async Task<SSISchema> Create(SSISchemaRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _schemaRequestValidator.ValidateAndThrowAsync(request);

            var schema = await _ssiProviderClient.CreateSchema(new SchemaRequest
            {
                Name = request.Name,
                ArtifactType = request.ArtifactType,
                Attributes = request.Attributes
            });

            return ConvertToSSISchema(schema);
        }
        #endregion

        #region Private Members
        private SSISchema ConvertToSSISchema(Schema schema)
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

            return ConvertToSSISchema(schema, matchedEntities);
        }

        private static SSISchema ConvertToSSISchema(Schema schema, List<SSISchemaEntity>? matchedEntities)
        {
            return new SSISchema
            {
                Id = schema.Id,
                Name = schema.Name,
                Version = schema.Version.ToString(),
                ArtifactType = schema.ArtifactType,
                Entities = matchedEntities,
                PropertyCount = matchedEntities?.Sum(o => o.Properties?.Count)
            };
        }
        #endregion
    }
}
