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
            var result = await GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(SSISchema)} with name '{name}' does not exists", nameof(name));
            return result;
        }

        public async Task<SSISchema?> GetByNameOrNull(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentNullException(nameof(name));
            name = name.Trim();

            var schema = await _ssiProviderClient.GetByName(name);
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

            results = schemas.Where(o => matchedEntitiesGrouped.ContainsKey(o.Id)).Select(o => new SSISchema
            {
                Id = o.Id,
                Name = o.Name,
                Version = o.Version.ToString(),
                ArtifactType = o.ArtifactType,
                Entities = matchedEntitiesGrouped.TryGetValue(o.Id, out var entities) ? entities : null
            }).ToList();

            return results;
        }

        public async Task<SSISchema> Create(SSISchemaRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _schemaRequestValidator.ValidateAndThrowAsync(request);

            var schema = await _ssiProviderClient.Create(new SchemaRequest
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

            var result = new SSISchema
            {
                Id = schema.Id,
                Name = schema.Name,
                Version = schema.Version.ToString(),
                ArtifactType = schema.ArtifactType,
                Entities = matchedEntities.Any() ? matchedEntities : null
            };
            return result;
        }
        #endregion
    }
}
