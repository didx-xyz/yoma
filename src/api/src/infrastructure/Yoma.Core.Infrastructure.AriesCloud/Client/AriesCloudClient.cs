using AriesCloudAPI.DotnetSDK.AspCore.Clients;
using AriesCloudAPI.DotnetSDK.AspCore.Clients.Exceptions;
using AriesCloudAPI.DotnetSDK.AspCore.Clients.Interfaces;
using AriesCloudAPI.DotnetSDK.AspCore.Clients.Models;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
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
        private readonly AppSettings _appSettings;
        private readonly ClientFactory _clientFactory;
        private readonly IMemoryCache _memoryCache;
        private readonly IRepository<Models.CredentialSchema> _credentialSchemaRepository;
        private readonly IRepository<Models.Connection> _connectionRepository;

        private const string Schema_Prefix_LdProof = "KtX2yAeljr0zZ9MuoQnIcWb";
        #endregion

        #region Constructor
        public AriesCloudClient(AppSettings appSettings,
            ClientFactory clientFactory,
            IMemoryCache memoryCache,
            IRepository<Models.CredentialSchema> credentialSchemaRepository,
            IRepository<Models.Connection> connectionRepository)
        {
            _appSettings = appSettings;
            _clientFactory = clientFactory;
            _memoryCache = memoryCache;
            _credentialSchemaRepository = credentialSchemaRepository;
            _connectionRepository = connectionRepository;
        }
        #endregion

        #region Public Members
        public async Task<List<Schema>?> ListSchemas(bool latestVersion)
        {
            var client = _clientFactory.CreateGovernanceClient();
            var schemasAries = await client.GetSchemasAsync();
            var schemasLocal = _credentialSchemaRepository.Query().ToList();

            return (schemasAries.ToSchema(latestVersion) ?? Enumerable.Empty<Schema>()).Concat(schemasLocal.ToSchema(latestVersion) ?? Enumerable.Empty<Schema>()).ToList();
        }

        public async Task<Schema> GetSchemaByName(string name)
        {
            var result = await GetSchemaByNameOrNull(name) ?? throw new ArgumentException($"{nameof(Schema)} with name '{name}' does not exists", nameof(name));
            return result;
        }

        public async Task<Schema?> GetSchemaByNameOrNull(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentNullException(nameof(name));
            name = name.Trim();

            var client = _clientFactory.CreateGovernanceClient();
            var schemasAries = await client.GetSchemasAsync(schema_name: name);
            var schemasLocal = _credentialSchemaRepository.Query().Where(o => o.Name == name).ToList();

            var results = (schemasAries.ToSchema(true) ?? Enumerable.Empty<Schema>()).Concat(schemasLocal.ToSchema(true) ?? Enumerable.Empty<Schema>()).ToList();
            if (results == null || !results.Any()) return null;

            if (results.Count > 1)
                throw new DataInconsistencyException($"More than one schema found with name '{name}' (latest version): {string.Join(", ", results.Select(o => $"{o.Name}:{o.ArtifactType}"))}");

            return results.SingleOrDefault();
        }

        public async Task<Schema> CreateSchema(SchemaRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            if (request.Attributes != null) request.Attributes = request.Attributes.Distinct().ToList();
            if (request.Attributes == null || !request.Attributes.Any())
                throw new ArgumentException($"'{nameof(request.Attributes)}' is required", nameof(request));

            var schemaExisting = await GetSchemaByNameOrNull(request.Name);

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
                    var schemaAries = await client.CreateSchemaAsync(schemaCreateRequest);
                    //schemas added to te trust registry
                    _memoryCache.Remove(nameof(TrustRegistry));
                    return schemaAries.ToSchema();

                case ArtifactType.Ld_proof:
                    var protocolVersion = _clientFactory.ProtocolVersion.TrimStart('v').TrimStart('V');

                    var credentialSchema = new Models.CredentialSchema
                    {
                        Id = $"{Schema_Prefix_LdProof}:{protocolVersion}:{request.Name}:{version}",
                        Name = request.Name,
                        Version = version.ToString(),
                        AttributeNames = JsonConvert.SerializeObject(request.Attributes),
                        ArtifactType = request.ArtifactType
                    };

                    var schemaLocal = await _credentialSchemaRepository.Create(credentialSchema);
                    return schemaLocal.ToSchema();

                default:
                    throw new InvalidOperationException($"Artifact type of '{request.ArtifactType}' not supported");
            }
        }

        public async Task<string> EnsureTenant(TenantRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            if (string.IsNullOrWhiteSpace(request.Reference))
                throw new ArgumentException($"'{nameof(request.Reference)}' is required", nameof(request));
            request.Reference = request.Reference.Trim();

            if (string.IsNullOrWhiteSpace(request.Name))
                throw new ArgumentException($"'{nameof(request.Name)}' is required", nameof(request));
            request.Name = request.Name.Trim();

            if (request.Roles != null) request.Roles = request.Roles.Distinct().ToList();
            if (request.Roles == null || !request.Roles.Any())
                throw new ArgumentException($"'{nameof(request.Roles)}' is required", nameof(request));

            request.ImageUrl = request.ImageUrl?.Trim();
            Uri? imageUri = null;
            if (!string.IsNullOrEmpty(request.ImageUrl) && !Uri.TryCreate(request.ImageUrl, UriKind.Absolute, out imageUri))
                throw new ArgumentException($"'{nameof(request.ImageUrl)}' is required / invalid", nameof(request));

            var client = _clientFactory.CreateCustomerClient();

            //try and find the tenant by name (TODO client reference)
            var tenant = await GetTenantByNameOrNull(request.Name, client);
            if (tenant == null)
            {
                var createTenantRequest = new CreateTenantRequest
                {
                    //TODO: client reference
                    Name = request.Name,
                    Roles = request.Roles.ToAriesRoles(),
                    Image_url = imageUri
                };

                var response = await client.CreateTenantAsync(createTenantRequest);

                if(createTenantRequest.Roles.Any()) //issuer and verifier added to trust registry; holder implicitly assigned to a tenant
                    _memoryCache.Remove(nameof(TrustRegistry));
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

        public async Task<string> IssueCredential(CredentialIssuanceRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            if (string.IsNullOrWhiteSpace(request.SchemaName))
                throw new ArgumentException($"'{nameof(request.SchemaName)}' is required", nameof(request));
            request.SchemaName = request.SchemaName.Trim();

            if (string.IsNullOrWhiteSpace(request.TenantIdIssuer))
                throw new ArgumentException($"'{nameof(request.TenantIdIssuer)}' is required", nameof(request));
            request.TenantIdIssuer = request.TenantIdIssuer.Trim();

            if (string.IsNullOrWhiteSpace(request.TenantIdHolder))
                throw new ArgumentException($"'{nameof(request.TenantIdHolder)}' is required", nameof(request));
            request.TenantIdHolder = request.TenantIdHolder.Trim();

            if (request.Attributes != null)
                request.Attributes = request.Attributes.Where(pair => !string.IsNullOrEmpty(pair.Value)).ToDictionary(pair => pair.Key, pair => pair.Value);
            if (request.Attributes == null || !request.Attributes.Any())
                throw new ArgumentException($"'{nameof(request.Attributes)}' is required", nameof(request));

            var schema = await GetSchemaByName(request.SchemaName);

            //validate specified attributes against schema
            var undefinedAttributes = request.Attributes.Keys.Except(schema.AttributeNames);
            if (undefinedAttributes.Any())
                throw new ArgumentException($"'{nameof(request.Attributes)}' contains attribute(s) not defined on the associated schema: '{string.Join(",", undefinedAttributes)}'");

            var clientCustomer = _clientFactory.CreateCustomerClient();

            var tenantIssuer = await clientCustomer.GetTenantAsync(tenant_id: request.TenantIdIssuer);
            var tenantHolder = await clientCustomer.GetTenantAsync(tenant_id: request.TenantIdHolder);

            var connection = await EnsureConnectionCI(tenantIssuer, tenantHolder);

            SendCredential sendCredentialRequest;
            switch (request.ArtifactType)
            {
                case ArtifactType.Indy:
                    var definitionId = await EnsureDefinition(tenantIssuer, schema);

                    sendCredentialRequest = new SendCredential
                    {
                        Type = CredentialType.Indy,
                        Connection_id = connection.TargetConnectionId,
                        Indy_credential_detail = new IndyCredential
                        {
                            Credential_definition_id = definitionId,
                            Attributes = request.Attributes
                        }
                    };
                    break;

                case ArtifactType.Ld_proof:

                    sendCredentialRequest = new SendCredential
                    {
                        Type = CredentialType.Ld_proof,
                        Connection_id = connection.TargetConnectionId,
                        Ld_credential_detail = new LDProofVCDetail
                        {
                            Credential = new Credential()
                        }
                    };

                    /*
                        https://aca-py.org/main/demo/AliceWantsAJsonCredential/#request-presentation-example
                        SendCredential(
                            type="ld_proof",
                            connection_id="",
                            protocol_version="v2",
                            ld_credential_detail=LDProofVCDetail(
                                credential=Credential(
                                    context=[
                                        "https://www.w3.org/2018/credentials/v1",
                                        "https://w3id.org/citizenship/v1"
                                    ],
                                    type=["VerifiableCredential", "PermanentResident"],
                                    issuanceDate="2021-04-12",
                                    issuer="",
                                    credentialSubject={
                                        "type": ["PermanentResident"],
                                        "id": "",
                                        "givenName": "ALICE",
                                        "familyName": "SMITH",
                                        "gender": "Female",
                                        "birthCountry": "Bahamas",
                                        "birthDate": "1958-07-17"
                                    }
                                ),
                                options=LDProofVCDetailOptions(proofType="Ed25519Signature2018"),
                            ),
                        )
                    */

                    break;

                default:
                    throw new InvalidOperationException($"Artifact type of '{request.ArtifactType}' not supported");
            }

            //send the credential by issuer
            var clientIssuer = _clientFactory.CreateTenantClient(tenantIssuer.Tenant_id);
            var credentialExchange = await clientIssuer.SendCredentialAsync(sendCredentialRequest);

            //request and store the credential by holder
            var clientHolder = _clientFactory.CreateTenantClient(tenantHolder.Tenant_id);
            credentialExchange = await clientHolder.RequestCredentialAsync(credentialExchange.Credential_id);
            credentialExchange = await clientHolder.StoreCredentialAsync(credentialExchange.Credential_id);

            return credentialExchange.Credential_id;
        }
        #endregion

        #region Private Members
        private TrustRegistry GetTrustRegistry()
        {
            if (!_appSettings.CacheEnabledByCacheItemTypes.HasFlag(CacheItemType.TrustRegistry))
            {
                var client = _clientFactory.CreatePublicClient();
                return client.GetTrustRegistryAsync().Result;
            }

            var result = _memoryCache.GetOrCreate(nameof(TrustRegistry), entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
                var client = _clientFactory.CreatePublicClient();
                return client.GetTrustRegistryAsync().Result;
            });

            return result ?? throw new InvalidOperationException($"Failed to retrieve the '{nameof(TrustRegistry)}' cache item");
        }

        private static async Task<Tenant?> GetTenantByNameOrNull(string name, ICustomerClient client)
        {
            //TODO: currently the client unique reference is the name; requested introduction of client reference and GetTenantByClientReferenceAsync capability
            var tenants = await client.GetTenantsAsync();
            return tenants.FirstOrDefault(o => string.Equals(name, o.Tenant_name, StringComparison.InvariantCultureIgnoreCase));
        }

        /// <summary>
        /// Ensure a credential definition for the specified issuer and schema (applies to artifact type Indy)
        /// </summary>
        private async Task<string> EnsureDefinition(Tenant tenantIssuer, Schema schema)
        {
            var client = _clientFactory.CreateTenantClient(tenantIssuer.Tenant_id);

            var existingDefinitions = await client.GetCredentialDefinitionsAsync(schema_id: schema.Id);
            existingDefinitions = existingDefinitions?.Where(o => string.Equals(o.Tag, schema.Id)).ToList();
            if (existingDefinitions?.Count > 1)
                throw new DataInconsistencyException($"More than one definition found with schema id and tag '{schema.Id}'");

            var definition = existingDefinitions?.SingleOrDefault();
            if (definition != null) return definition.Id;

            definition = await client.CreateCredentialDefinitionAsync(new CreateCredentialDefinition
            {
                Schema_id = schema.Id,
                Tag = schema.Id,
                Support_revocation = true
            });

            //definitions added to the trust registry
            _memoryCache.Remove(nameof(TrustRegistry));

            return definition.Id;
        }

        /// <summary>
        /// Ensure a connection between the Issuer & Holder, initiated by the Issuer
        /// </summary>
        private async Task<Models.Connection> EnsureConnectionCI(Tenant tenantSource, Tenant tenantTarget)
        {
            //try and find an existing connection
            var result = _connectionRepository.Query().SingleOrDefault(o =>
                o.SourceTenantId == tenantSource.Tenant_id && o.TargetTenantId == tenantTarget.Tenant_id && o.Protocol == Connection_protocol.Connections_1_0);

            var clientIssuer = _clientFactory.CreateTenantClient(tenantSource.Tenant_id);

            Connection? connectionAries = null;
            if (result != null)
            {
                try
                {
                    //ensure connected (active)
                    connectionAries = await clientIssuer.GetConnectionAsync(result.SourceConnectionId);

                    if (connectionAries != null
                        && string.Equals(connectionAries.State, Models.ConnectionState.Completed.ToString(), StringComparison.InvariantCultureIgnoreCase)) return result;

                    await _connectionRepository.Delete(result);
                }
                catch (HttpClientException ex)
                {
                    if (ex.StatusCode != System.Net.HttpStatusCode.NotFound) throw;
                }
            }

            //create invitation by issuer
            var createInvitationRequest = new CreateInvitation
            {
                Alias = $"'{tenantSource.Tenant_name}' >> '{tenantTarget.Tenant_name}'",
                Multi_use = false,
                Use_public_did = false
            };

            var invitation = await clientIssuer.CreateInvitationAsync(createInvitationRequest);

            //accept invitation by holder
            var acceptInvitationRequest = new AcceptInvitation
            {
                Alias = $"'{tenantSource.Tenant_name}' >> '{tenantTarget.Tenant_name}'",
                Use_existing_connection = true,
                Invitation = new ReceiveInvitationRequest
                {
                    Did = invitation.Invitation.Did,
                    Id = invitation.Invitation.Id,
                    ImageUrl = invitation.Invitation.ImageUrl,
                    Label = invitation.Invitation.Label,
                    RecipientKeys = invitation.Invitation.RecipientKeys,
                    RoutingKeys = invitation.Invitation.RoutingKeys,
                    ServiceEndpoint = invitation.Invitation.ServiceEndpoint,
                    Type = invitation.Invitation.Type
                }
            };
            var clientHolder = _clientFactory.CreateTenantClient(tenantTarget.Tenant_id);
            connectionAries = await clientHolder.AcceptInvitationAsync(acceptInvitationRequest);

            result = new Models.Connection
            {
                SourceTenantId = tenantSource.Tenant_id,
                SourceConnectionId = invitation.Connection_id,
                TargetTenantId = tenantTarget.Tenant_id,
                TargetConnectionId = connectionAries.Connection_id,
                Protocol = connectionAries.Connection_protocol
            };

            result = await _connectionRepository.Create(result);

            return result;
        }
        #endregion
    }
}
