using AriesCloudAPI.DotnetSDK.AspCore.Clients;
using AriesCloudAPI.DotnetSDK.AspCore.Clients.Models;
using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Exceptions;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Provider;

namespace Yoma.Core.Infrastructure.AriesCloud.Client
{
    public class AriesCloudClient : ISSIProviderClient
    {
        #region Class Variables
        private readonly ClientFactory _clientFactory;
        private readonly IRepository<Models.CredentialSchema> _credentialSchemaRepository;

        private const string Schema_Prefix_LdProof = "KtX2yAeljr0zZ9MuoQnIcWb";
        #endregion

        #region Constructor
        public AriesCloudClient(ClientFactory clientFactory,
            IRepository<Models.CredentialSchema> credentialSchemaRepository)
        {
            _clientFactory = clientFactory;
            _credentialSchemaRepository = credentialSchemaRepository;
        }
        #endregion

        #region Public Members
        public async Task<List<Schema>?> ListSchemas(bool latestVersion)
        {
            var client = _clientFactory.CreateGovernanceClient();
            var schemasAries = await client.GetSchemasAsync();
            var schemasLocal = _credentialSchemaRepository.Query().ToList();

            return (ToSchema(schemasAries, latestVersion) ?? Enumerable.Empty<Schema>()).Concat(ToSchema(schemasLocal, latestVersion) ?? Enumerable.Empty<Schema>()).ToList();
        }

        public async Task<Schema?> GetByName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentNullException(nameof(name));
            name = name.Trim();

            var client = _clientFactory.CreateGovernanceClient();
            var schemasAries = await client.GetSchemasAsync(schema_name: name);
            var schemasLocal = _credentialSchemaRepository.Query().Where(o => o.Name == name).ToList();

            var results = (ToSchema(schemasAries, true) ?? Enumerable.Empty<Schema>()).Concat(ToSchema(schemasLocal, true) ?? Enumerable.Empty<Schema>()).ToList();
            if (results == null || !results.Any()) return null;

            if (results.Count > 1)
                throw new DataInconsistencyException($"More than one schema found with name '{name}' (latest version): {string.Join(", ", results.Select(o => $"{o.Name}:{o.ArtifactType}"))}");

            return results.SingleOrDefault();
        }

        public async Task<Schema> Create(SchemaRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            if (!request.Attributes.Any())
                throw new ArgumentNullException(nameof(request), "One or more associated attributes required");

            var schemaExisting = await GetByName(request.Name);

            var version = VersionExtensions.Default;
            if (schemaExisting != null)
            {
                if (schemaExisting.ArtifactType != request.ArtifactType)
                    throw new ArgumentException($"Schema with name '{request.Name}' already exist in artifact store '{schemaExisting.ArtifactType}'");
                version = schemaExisting.Version.IncrementMinor();
            }

            switch (request.ArtifactType)
            {
                case ArtifactType.Indy:
                    var schemaCreateRequest = new CreateSchema
                    {
                        Name = request.Name,
                        Version = version.ToString(),
                        Attribute_names = request.Attributes
                    };

                    var client = _clientFactory.CreateGovernanceClient();
                    return ToSchema(await client.CreateSchemaAsync(schemaCreateRequest));

                case ArtifactType.Ld_proof:
                    var credentialSchema = new Models.CredentialSchema
                    {
                        Id = $"{Schema_Prefix_LdProof}:2:{request.Name}:{version}",
                        Name = request.Name,
                        Version = version.ToString(),
                        AttributeNames = JsonConvert.SerializeObject(request.Attributes),
                        ArtifactType = request.ArtifactType
                    };

                    return ToSchema(await _credentialSchemaRepository.Create(credentialSchema));

                default:
                    throw new InvalidOperationException($"Artifact type of '{request.ArtifactType}' not supported");
            }
        }
        #endregion

        #region Private Members
        private static List<Schema>? ToSchema(ICollection<CredentialSchema> schemas, bool latestVersion)
        {
            if (!schemas.Any()) return null;

            var results = schemas.Select(ToSchema).ToList();

            results = FilterByLatestVersion(latestVersion, results);

            return results;
        }

        private static Schema ToSchema(CredentialSchema o)
        {
            return new Schema
            {
                Id = o.Id,
                Name = o.Name,
                Version = Version.Parse(o.Version).ToMajorMinor(),
                ArtifactType = ArtifactType.Indy,
                AttributeNames = o.Attribute_names
            };
        }

        private static List<Schema>? ToSchema(ICollection<Models.CredentialSchema> schemas, bool latestVersion)
        {
            if (!schemas.Any()) return null;

            var results = schemas.Select(o => ToSchema(o)).ToList();

            results = FilterByLatestVersion(latestVersion, results);

            return results;
        }

        private static Schema ToSchema(Models.CredentialSchema o)
        {
            return new Schema
            {
                Id = o.Id,
                Name = o.Name,
                Version = Version.Parse(o.Version).ToMajorMinor(),
                ArtifactType = o.ArtifactType,
                AttributeNames = JsonConvert.DeserializeObject<ICollection<string>>(o.AttributeNames) ?? new List<string>(),
            };
        }

        private static List<Schema> FilterByLatestVersion(bool latestVersion, List<Schema> results)
        {
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
