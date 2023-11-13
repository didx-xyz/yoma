using AriesCloudAPI.DotnetSDK.AspCore.Clients;
using AriesCloudAPI.DotnetSDK.AspCore.Clients.Interfaces;
using AriesCloudAPI.DotnetSDK.AspCore.Clients.Models;
using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Exceptions;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Infrastructure.AriesCloud.Extensions;
using Yoma.Core.Infrastructure.AriesCloud.Interfaces;

namespace Yoma.Core.Infrastructure.AriesCloud.Client
{
    public class AriesCloudClient : ISSIProviderClient
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly ClientFactory _clientFactory;
        private readonly ISSEListenerService _sseListenerService;
        private readonly IRepository<Models.CredentialSchema> _credentialSchemaRepository;
        private readonly IRepository<Models.Connection> _connectionRepository;

        private const string Schema_Prefix_LdProof = "KtX2yAeljr0zZ9MuoQnIcWb";
        #endregion

        #region Constructor
        public AriesCloudClient(AppSettings appSettings,
            ClientFactory clientFactory,
            ISSEListenerService sseListenerService,
            IRepository<Models.CredentialSchema> credentialSchemaRepository,
            IRepository<Models.Connection> connectionRepository)
        {
            _appSettings = appSettings;
            _clientFactory = clientFactory;
            _sseListenerService = sseListenerService;
            _credentialSchemaRepository = credentialSchemaRepository;
            _connectionRepository = connectionRepository;
        }
        #endregion

        #region Public Members
        public async Task<List<Domain.SSI.Models.Provider.Schema>?> ListSchemas(bool latestVersion)
        {
            var client = _clientFactory.CreateGovernanceClient();
            var schemasAries = await client.GetSchemasAsync();
            var schemasLocal = _credentialSchemaRepository.Query().ToList();

            return (schemasAries.ToSchema(latestVersion)
                ?? Enumerable.Empty<Domain.SSI.Models.Provider.Schema>()).Concat(schemasLocal.ToSchema(latestVersion) ?? Enumerable.Empty<Domain.SSI.Models.Provider.Schema>()).ToList();
        }

        public async Task<Domain.SSI.Models.Provider.Schema> GetSchemaByName(string name)
        {
            var result = await GetSchemaByNameOrNull(name) ?? throw new ArgumentException($"{nameof(Domain.SSI.Models.Provider.Schema)} with name '{name}' does not exists", nameof(name));
            return result;
        }

        public async Task<Domain.SSI.Models.Provider.Schema?> GetSchemaByNameOrNull(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentNullException(nameof(name));
            name = name.Trim();

            var client = _clientFactory.CreateGovernanceClient();
            var schemasAries = await client.GetSchemasAsync(schema_name: name);
            var schemasLocal = _credentialSchemaRepository.Query().Where(o => o.Name == name).ToList();

            var results = (schemasAries.ToSchema(true) ?? Enumerable.Empty<Domain.SSI.Models.Provider.Schema>()).Concat(schemasLocal.ToSchema(true) ?? Enumerable.Empty<Domain.SSI.Models.Provider.Schema>()).ToList();
            if (results == null || !results.Any()) return null;

            if (results.Count > 1)
                throw new DataInconsistencyException($"More than one schema found with name '{name}' (latest version): {string.Join(", ", results.Select(o => $"{o.Name}:{o.ArtifactType}"))}");

            return results.SingleOrDefault();
        }

        public async Task<List<Domain.SSI.Models.Provider.Credential>?> ListCredentials(string tenantIdHolder)
        {
            if (string.IsNullOrWhiteSpace(tenantIdHolder))
                throw new ArgumentNullException(nameof(tenantIdHolder));
            tenantIdHolder = tenantIdHolder.Trim();

            var clientCustomer = _clientFactory.CreateCustomerClient();

            Tenant? tenantHolder = null;
            try
            {
                tenantHolder = await clientCustomer.GetTenantAsync(wallet_id: tenantIdHolder);
            }
            catch (AriesCloudAPI.DotnetSDK.AspCore.Clients.Exceptions.HttpClientException ex)
            {
                if (ex.StatusCode != System.Net.HttpStatusCode.NotFound) throw;
            }
            if (tenantHolder == null) return null;

            var clientHolder = _clientFactory.CreateTenantClient(tenantHolder.Wallet_id);

            //TODO: ld_proofs
            var indyCredentials = await clientHolder.GetIndyCredentialsAsync();

            var results = indyCredentials?.Results?.Select(o => o.ToCredential()).ToList();
            return results;
        }

        public async Task<Domain.SSI.Models.Provider.Schema> UpsertSchema(SchemaRequest request)
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

            if (string.IsNullOrWhiteSpace(request.Referent))
                throw new ArgumentException($"'{nameof(request.Referent)}' is required", nameof(request));
            request.Referent = request.Referent.Trim();

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

            var tenant = await GetTenantByWalletNameOrNull(request.Referent, client);
            if (tenant == null)
            {
                var createTenantRequest = new CreateTenantRequest
                {
                    Wallet_name = request.Referent,
                    Wallet_label = request.Name,
                    Roles = request.Roles.ToAriesRoles(),
                    Image_url = imageUri?.ToString()
                };

                var response = await client.CreateTenantAsync(createTenantRequest);

                return response.Wallet_id;
            }

            var existingRoles = new List<Role>() { Role.Holder };

            var clientPublic = _clientFactory.CreatePublicClient();
            ICollection<Actor>? actors = null;
            try
            {
                actors = await clientPublic.GetTrustRegistryActorsAsync(null, tenant.Wallet_id, null);
            }
            catch (AriesCloudAPI.DotnetSDK.AspCore.Clients.Exceptions.HttpClientException ex)
            {
                if (ex.StatusCode != System.Net.HttpStatusCode.NotFound) throw;
            }

            if (actors?.Count > 1)
                throw new InvalidOperationException($"More than one actor found for tenant with id '{tenant.Wallet_id}'");

            var actor = actors?.SingleOrDefault();
            if (actor != null) existingRoles.AddRange(actor.Roles.ToSSIRoles());

            var diffs = request.Roles.Except(existingRoles).ToList();
            if (diffs.Any())
                throw new DataInconsistencyException(
                    $"Role mismatched detected for tenant with id '{tenant.Wallet_id}'. Updating of tenant are not supported");

            return tenant.Wallet_id;
        }

        public async Task<string?> IssueCredential(CredentialIssuanceRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            request.ClientReferent = new KeyValuePair<string, string>(request.ClientReferent.Key?.Trim() ?? string.Empty, request.ClientReferent.Value?.Trim() ?? string.Empty);
            if (string.IsNullOrEmpty(request.ClientReferent.Key) && string.IsNullOrEmpty(request.ClientReferent.Value))
                throw new ArgumentException($"'{nameof(request.ClientReferent)}' is required", nameof(request));

            if (string.IsNullOrWhiteSpace(request.SchemaName))
                throw new ArgumentException($"'{nameof(request.SchemaName)}' is required", nameof(request));
            request.SchemaName = request.SchemaName.Trim();

            if (string.IsNullOrWhiteSpace(request.SchemaType))
                throw new ArgumentException($"'{nameof(request.SchemaType)}' is required", nameof(request));
            request.SchemaType = request.SchemaType.Trim();

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
                throw new ArgumentException($"'{nameof(request.Attributes)}' contains attribute(s) not defined on the associated schema ('{request.SchemaName}'): '{string.Join(",", undefinedAttributes)}'");

            var clientCustomer = _clientFactory.CreateCustomerClient();

            var tenantHolder = await clientCustomer.GetTenantAsync(wallet_id: request.TenantIdHolder);
            var clientHolder = _clientFactory.CreateTenantClient(tenantHolder.Wallet_id);

            //check if credential was issued based on clientReferent
            var result = await GetCredentialReferentByClientReferentOrNull(clientHolder, request.ArtifactType, request.ClientReferent, false);
            if (!string.IsNullOrEmpty(result)) return result;

            var tenantIssuer = await clientCustomer.GetTenantAsync(wallet_id: request.TenantIdIssuer);
            var clientIssuer = _clientFactory.CreateTenantClient(tenantIssuer.Wallet_id);

            var connection = await EnsureConnectionCI(tenantIssuer, clientIssuer, tenantHolder, clientHolder);

            SendCredential sendCredentialRequest;
            switch (request.ArtifactType)
            {
                case ArtifactType.Indy:
                    var definitionId = await EnsureDefinition(clientIssuer, schema);

                    sendCredentialRequest = new SendCredential
                    {
                        Type = CredentialType.Indy,
                        Connection_id = connection.SourceConnectionId,
                        Indy_credential_detail = new IndyCredential
                        {
                            Credential_definition_id = definitionId,
                            Attributes = request.Attributes
                        }
                    };
                    break;

                case ArtifactType.Ld_proof:
                    var dids = await clientIssuer.GetDidsAsync();
                    var did = dids.SingleOrDefault(o => o.Key_type == DIDKey_type.Ed25519 && o.Posture == DIDPosture.Posted)
                        ?? throw new InvalidOperationException($"Failed to retrieve the issuer DID of type '{DIDKey_type.Ed25519}' and posture '{DIDPosture.Posted}'");
                    var credentialSubject = new Dictionary<string, string> { { "type", request.SchemaType } };
                    credentialSubject = credentialSubject.Concat(request.Attributes).ToDictionary(x => x.Key, x => x.Value);

                    sendCredentialRequest = new SendCredential
                    {
                        Type = CredentialType.Ld_proof,
                        Connection_id = connection.SourceConnectionId,
                        Ld_credential_detail = new LDProofVCDetail
                        {
                            Credential = new AriesCloudAPI.DotnetSDK.AspCore.Clients.Models.Credential
                            {
                                Context = new List<string> { "https://www.w3.org/2018/credentials/v1" },
                                Type = new List<string> { "VerifiableCredential", request.SchemaType },
                                IssuanceDate = DateTimeOffset.Now.ToString("yyyy-MM-dd"),
                                Issuer = did.Did,
                                CredentialSubject = credentialSubject,
                            },
                            Options = new LDProofVCDetailOptions
                            {
                                ProofType = "Ed25519Signature2018"
                            }
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
            WebhookEvent<CredentialExchange>? sseEvent = null;
            await Task.Run(async () =>
            {
                //send the credential by issuer
                var credentialExchange = await clientIssuer.SendCredentialAsync(sendCredentialRequest);

                // await sse event on holders side (in order to retrieve the holder credential id)  
                sseEvent = await _sseListenerService.Listen<CredentialExchange>(tenantHolder.Wallet_id,
                  Topic.Credentials, "thread_id", credentialExchange.Thread_id, CredentialExchangeState.OfferReceived.ToEnumMemberValue());
            });

            if (sseEvent == null)
                throw new InvalidOperationException($"Failed to receive SSE event for topic '{Topic.Credentials}' and desired state '{CredentialExchangeState.OfferReceived}'");

            // request the credential by holder (aries cloud auto completes and store the credential in the holders wallet)
            var credentialExchange = await clientHolder.RequestCredentialAsync(sseEvent.payload.Credential_id);

            await Task.Run(async () =>
            {
                // await sse event on holders side (in order to ensure credential issuance is done) 
                sseEvent = await _sseListenerService.Listen<CredentialExchange>(tenantHolder.Wallet_id,
                  Topic.Credentials, "credential_id", credentialExchange.Credential_id, CredentialExchangeState.Done.ToEnumMemberValue());
            });

            if (sseEvent == null)
                throw new InvalidOperationException($"Failed to receive SSE event for topic '{Topic.Credentials}' and desired state '{CredentialExchangeState.Done}'");

            result = await GetCredentialReferentByClientReferentOrNull(clientHolder, request.ArtifactType, request.ClientReferent, true);
            return result;
        }
        #endregion

        #region Private Members
        private static async Task<Tenant?> GetTenantByWalletNameOrNull(string walletName, ICustomerClient client)
        {
            var tenants = await client.GetTenantsAsync(wallet_name: walletName);

            if (tenants?.Count > 1)
                throw new InvalidOperationException($"More than one tenant found with wallet name '{walletName}'");

            return tenants?.SingleOrDefault(o => string.Equals(walletName, o.Wallet_name, StringComparison.InvariantCultureIgnoreCase));
        }

        /// <summary>
        /// Ensure a credential definition for the specified issuer and schema (applies to artifact type Indy)
        /// </summary>
        private static async Task<string> EnsureDefinition(ITenantClient clientIssuer, Domain.SSI.Models.Provider.Schema schema)
        {
            var tagComponents = schema.Id.Split(':');
            var tag = string.Join(string.Empty, tagComponents.Skip(1));

            var existingDefinitions = await clientIssuer.GetCredentialDefinitionsAsync(schema_id: schema.Id);
            existingDefinitions = existingDefinitions?.Where(o => string.Equals(o.Tag, tag)).ToList();
            if (existingDefinitions?.Count > 1)
                throw new DataInconsistencyException($"More than one definition found with schema id and tag '{tag}'");

            var definition = existingDefinitions?.SingleOrDefault();
            if (definition != null) return definition.Id;

            definition = await clientIssuer.CreateCredentialDefinitionAsync(new CreateCredentialDefinition
            {
                Schema_id = schema.Id,
                Tag = tag,
                Support_revocation = true
            });

            return definition.Id;
        }

        /// <summary>
        /// Ensure a connection between the Issuer & Holder, initiated by the Issuer
        /// </summary>
        private async Task<Models.Connection> EnsureConnectionCI(Tenant tenantIssuer, ITenantClient clientIssuer, Tenant tenantHolder, ITenantClient clientHolder)
        {
            //try and find an existing connection
            var result = _connectionRepository.Query().SingleOrDefault(o =>
                o.SourceTenantId == tenantIssuer.Wallet_id && o.TargetTenantId == tenantHolder.Wallet_id && o.Protocol == Connection_protocol.Connections_1_0.ToString());

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
                catch (AriesCloudAPI.DotnetSDK.AspCore.Clients.Exceptions.HttpClientException ex)
                {
                    if (ex.StatusCode != System.Net.HttpStatusCode.NotFound) throw;
                }
            }

            //create invitation by issuer
            var createInvitationRequest = new CreateInvitation
            {
                Alias = $"'{tenantIssuer.Wallet_label}' >> '{tenantHolder.Wallet_label}'",
                Multi_use = false,
                Use_public_did = false
            };

            var invitation = await clientIssuer.CreateInvitationAsync(createInvitationRequest);

            //accept invitation by holder
            var acceptInvitationRequest = new AcceptInvitation
            {
                Alias = $"'{tenantIssuer.Wallet_label}' >> '{tenantHolder.Wallet_label}'",
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

            connectionAries = await clientHolder.AcceptInvitationAsync(acceptInvitationRequest);

            result = new Models.Connection
            {
                SourceTenantId = tenantIssuer.Wallet_id,
                SourceConnectionId = invitation.Connection_id,
                TargetTenantId = tenantHolder.Wallet_id,
                TargetConnectionId = connectionAries.Connection_id,
                Protocol = connectionAries.Connection_protocol.ToString()
            };

            result = await _connectionRepository.Create(result);

            return result;
        }

        private static async Task<string?> GetCredentialReferentByClientReferentOrNull(ITenantClient clientHolder, ArtifactType artifactType,
            KeyValuePair<string, string> clientReferent, bool throwNotFound)
        {
            var wqlQueryString = $"{{\"attr::{clientReferent.Key}::value\":\"{clientReferent.Value}\"}}";

            switch (artifactType)
            {
                case ArtifactType.Indy:
                    var credsIndy = await clientHolder.GetIndyCredentialsAsync(null, null, wqlQueryString);

                    if (credsIndy?.Results?.Count > 1)
                        throw new InvalidOperationException($"More than one credential found for client referent '{clientReferent}'");

                    var credIndy = credsIndy?.Results?.SingleOrDefault();

                    if (credIndy == null)
                    {
                        if (throwNotFound)
                            throw new InvalidOperationException($"Credential expected but not found for client referent '{clientReferent}'");
                        return null;
                    }
                    else
                    {
                        var result = credIndy?.Referent?.Trim();
                        if (string.IsNullOrEmpty(result))
                            throw new InvalidOperationException($"Credential referent expected but is null / empty client referent '{clientReferent}'");
                        return result;
                    }

                case ArtifactType.Ld_proof:
                    ICollection<W3CCredentialsListRequest>? credsW3C = null;
                    try
                    {
                        credsW3C = await clientHolder.GetW3CCredentialsAsync(null, null, wqlQueryString);
                    }
                    catch (AriesCloudAPI.DotnetSDK.AspCore.Clients.Exceptions.HttpClientException ex)
                    {
                        if (ex.StatusCode != System.Net.HttpStatusCode.NotFound) throw;
                    }

                    if (credsW3C?.Count > 1)
                        throw new InvalidOperationException($"More than one credential found for client referent '{clientReferent}'");

                    var credW3C = credsW3C?.SingleOrDefault();

                    if (credsW3C == null)
                    {
                        if (throwNotFound)
                            throw new InvalidOperationException($"Credential expected but not found for client referent '{clientReferent}'");
                        return null;
                    }
                    else
                    {
                        var result = credW3C?.Given_id?.Trim();
                        if (string.IsNullOrEmpty(result))
                            throw new InvalidOperationException($"Credential referent expected but is null / empty client referent '{clientReferent}'");
                        return result;
                    }

                default:
                    throw new InvalidOperationException($"Artifact type of '{artifactType}' not supported");
            }
        }
        #endregion
    }
}
