using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Services
{
    public class SSISchemaService : ISSISchemaService
    {
        #region Class Variables
        private readonly ISSIProviderClient _ssiProviderClient;
        private readonly ISSISchemaEntityService _ssiSchemaEntityService;
        #endregion

        #region Constructor
        public SSISchemaService(ISSIProviderClientFactory ssiProviderClientFactory,
            ISSISchemaEntityService ssiSchemaEntityService)
        {
            _ssiProviderClient = ssiProviderClientFactory.CreateClient();
            _ssiSchemaEntityService = ssiSchemaEntityService;
        }
        #endregion

        #region Public Members
        public async Task<List<SSISchema>> List(bool? latestVersions)
        {
            var schemas = await _ssiProviderClient.ListSchemas();

            if (latestVersions.HasValue && latestVersions.Value)
            {
                schemas = schemas
                    .GroupBy(s => s.Id)
                    .Select(group => group.OrderByDescending(s => s.Version).First())
                    .ToList();
            }

            var results = new List<SSISchema>();

            //no configured schemas found 
            if (!schemas.Any()) return results;

            var matchedEntitiesGrouped = _ssiSchemaEntityService.List()
                .SelectMany(entity => schemas
                    .Where(schema => schema.AttributeNames
                        .Any(attributeName => entity.Properties?.Any(property =>
                            string.Equals(property.NameAttribute, attributeName, StringComparison.InvariantCultureIgnoreCase)
                        ) == true
                    ))
                    .Select(schema => new { SchemaId = schema.Id, Entity = entity })
                )
                .GroupBy(item => item.SchemaId, item => item.Entity)
                .ToDictionary(group => group.Key, group => group.ToList());

            //no matches found for schema attributes that match entities
            if (matchedEntitiesGrouped == null || !matchedEntitiesGrouped.Any()) return results;

            //only includes schemas with matched entities
            results = schemas.Where(o => matchedEntitiesGrouped.ContainsKey(o.Id)).Select(o => new SSISchema
            {
                Id = o.Id,
                Name = o.Name,
                Version = o.Version.ToString(),
                Entities = matchedEntitiesGrouped.TryGetValue(o.Id, out var entities) ? entities : null
            }).ToList();

            return results;
        }

        public Task<SSISchema> Create(SSISchemaRequest request)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
