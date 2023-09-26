using AriesCloudAPI.DotnetSDK.AspCore.Clients;
using AriesCloudAPI.DotnetSDK.AspCore.Clients.Models;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models.Provider;

namespace Yoma.Core.Infrastructure.AriesCloud.Client
{
    public class AriesCloudClient : ISSIProviderClient
    {
        #region Class Variables
        private readonly ClientFactory _clientFactory;
        #endregion

        #region Constructor
        public AriesCloudClient(ClientFactory clientFactory)
        {
            _clientFactory = clientFactory;
        }
        #endregion

        #region Public Members
        public async Task<List<Schema>?> ListSchemas(bool latestVersion)
        {
            var client = _clientFactory.CreateGovernanceClient();
            var schemas = await client.GetSchemasAsync();

            return FilterByLatestVersion(schemas, latestVersion);
        }

        public async Task<Schema?> GetByName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentNullException(nameof(name));
            name = name.Trim();

            var client = _clientFactory.CreateGovernanceClient();
            var schemas = await client.GetSchemasAsync(schema_name: name);

            var results = FilterByLatestVersion(schemas, true);
            if (results == null || !results.Any()) return null;

            if (results.Count > 1)
                throw new InvalidOperationException("Single result expected for schema by name, latest version");

            return results.SingleOrDefault();
        }

        public async Task<Schema> Create(SchemaRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            if (!request.Attributes.Any())
                throw new ArgumentNullException(nameof(request), "One or more associated attributes required");

            var schemaExisting = await GetByName(request.Name);

            var version = schemaExisting == null ? VersionExtensions.Default : schemaExisting.Version.IncrementMinor();
            var schemaCreateRequest = new CreateSchema
            {
                Name = request.Name,
                Version = version.ToString(),
                Attribute_names = request.Attributes
            };

            var client = _clientFactory.CreateGovernanceClient();
            var result = await client.CreateSchemaAsync(schemaCreateRequest);

            return new Schema
            {
                Id = result.Id,
                Name = result.Name,
                Version = Version.Parse(result.Version).ToMajorMinor(),
                AttributeNames = result.Attribute_names
            };
        }
        #endregion

        #region Private Members
        private static List<Schema>? FilterByLatestVersion(ICollection<CredentialSchema> schemas, bool latestVersion)
        {
            if (!schemas.Any()) return null;

            var results = schemas.Select(o => new Schema
            {
                Id = o.Id,
                Name = o.Name,
                Version = Version.Parse(o.Version).ToMajorMinor(),
                AttributeNames = o.Attribute_names
            }).ToList();

            if (latestVersion)
                results = results
                  .GroupBy(s => s.Name)
                  .Select(group => group.OrderByDescending(s => s.Version).First())
                  .ToList();

            return results;
        }
        #endregion
    }
}
