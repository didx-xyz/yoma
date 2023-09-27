using AriesCloudAPI.DotnetSDK.AspCore.Clients;
using AriesCloudAPI.DotnetSDK.AspCore.Clients.Exceptions;
using AriesCloudAPI.DotnetSDK.AspCore.Clients.Interfaces;
using AriesCloudAPI.DotnetSDK.AspCore.Clients.Models;
using Flurl;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using System.Data;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Exceptions;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Infrastructure.AriesCloud.Extensions;

namespace Yoma.Core.Infrastructure.AriesCloud.Client
{
    public class AriesCloudClient : ISSIProviderClient
    {
        #region Class Variables
        private readonly ClientFactory _clientFactory;
        private readonly IMemoryCache _memoryCache;
        private readonly IRepository<Models.CredentialSchema> _credentialSchemaRepository;

        private const string Schema_Prefix_LdProof = "KtX2yAeljr0zZ9MuoQnIcWb";
        #endregion

        #region Constructor
        public AriesCloudClient(ClientFactory clientFactory,
            IMemoryCache memoryCache,
            IRepository<Models.CredentialSchema> credentialSchemaRepository)
        {
            _clientFactory = clientFactory;
            _memoryCache = memoryCache;
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

        public async Task<Schema?> GetSchemaByName(string name)
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

        public async Task<Schema> CreateSchema(SchemaRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            if (!request.Attributes.Any())
                throw new ArgumentNullException(nameof(request), "One or more associated attributes required");

            var schemaExisting = await GetSchemaByName(request.Name);

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

        public async Task<string> EnsureTenant(TenantRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            request.TenantId = request.TenantId?.Trim();

            if (string.IsNullOrWhiteSpace(request.Name))
                throw new ArgumentNullException(nameof(request), "Name is required");
            request.Name = request.Name.Trim();

            if (request.Roles == null || !request.Roles.Any())
                throw new ArgumentNullException(nameof(request), "Roles is required");

            request.ImageUrl = request.ImageUrl?.Trim();
            if (!string.IsNullOrEmpty(request.ImageUrl) && !Uri.IsWellFormedUriString(request.ImageUrl, UriKind.Absolute))
                throw new ArgumentException("ImageUrl is invalid", nameof(request));

            var client = _clientFactory.CreateCustomerClient();

            //try and find the tenant by id, is specified
            var tenant = await GetTenantByIdOrNull(request.TenantId, client);

            if (tenant == null)
            {
                var createTenantRequest = new CreateTenantRequest
                {
                    Name = request.Name,
                    Roles = request.Roles.ToAriesRoles(),
                };

                var response = await client.CreateTenantAsync(createTenantRequest);
                return response.Tenant_id;
            }

            var existingRoles = new List<Role>() { Role.Holder };
            var actor = GetTrustRegistry().Actors.SingleOrDefault(o => o.Id == tenant.Tenant_id);
            if (actor != null) existingRoles.AddRange(actor.Roles.ToSSIRoles());

            var diffs = request.Roles.Except(existingRoles).ToList();
            if (diffs.Any())
                throw new DataInconsistencyException(
                    $"Role mismatched detected for tenant with id '{tenant.Tenant_id}'. Updating of tenant are not supported");

            return tenant.Tenant_id;
        }
        #endregion

        #region Private Members
        private TrustRegistry GetTrustRegistry()
        {
            var result = _memoryCache.GetOrCreate(nameof(TrustRegistry), entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromMinutes(1);
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1);
                var client = _clientFactory.CreatePublicClient();
                return client.GetTrustRegistryAsync().Result;
            });

            return result == null ? throw new InvalidOperationException($"Failed to get the '{nameof(TrustRegistry)}' cache item") : result;
        }

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

        private static async Task<Tenant?> GetTenantByIdOrNull(string? tenantId, ICustomerClient client)
        {
            Tenant? result = null;
            if (!string.IsNullOrEmpty(tenantId))
            {
                try
                {
                    //utilize GetTenantAsync instead of GetTenantsAsync() with client side filtering
                    result = await client.GetTenantAsync(tenantId);
                }
                catch (HttpClientException ex)
                {
                    if (ex.StatusCode != System.Net.HttpStatusCode.NotFound) throw;
                }
            }

            return result;
        }
        #endregion
    }
}
