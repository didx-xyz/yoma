using Aries.CloudAPI.DotnetSDK.AspCore.Clients;
using Aries.CloudAPI.DotnetSDK.AspCore.Clients.Interfaces;
using Aries.CloudAPI.DotnetSDK.AspCore.Clients.Models;
using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Infrastructure.AriesCloud.Extensions;
using Yoma.Core.Infrastructure.AriesCloud.Interfaces;

namespace Yoma.Core.Infrastructure.AriesCloud.Client
{
  public class AriesCloudClient : ISSIProviderClient
  {
    #region Class Variables
    private readonly ClientFactory _clientFactory;
    private readonly ISSEListenerService _sseListenerService;
    private readonly IRepository<Models.Credential> _credentialRepository;
    private readonly IRepository<Models.CredentialSchema> _credentialSchemaRepository;
    private readonly IRepository<Models.Connection> _connectionRepository;

    private static readonly SemaphoreSlim _definitionLock = new(1, 1);
    private const string Schema_Prefix_JWT = "DEEGg5EAUmvm4goxOygg64p";
    #endregion

    #region Constructor
    public AriesCloudClient(ClientFactory clientFactory,
        ISSEListenerService sseListenerService,
        IRepository<Models.Credential> credentialRepository,
        IRepository<Models.CredentialSchema> credentialSchemaRepository,
        IRepository<Models.Connection> connectionRepository)
    {
      _clientFactory = clientFactory;
      _sseListenerService = sseListenerService;
      _credentialRepository = credentialRepository;
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

      var results = (schemasAries.ToSchema(latestVersion)
          ?? Enumerable.Empty<Domain.SSI.Models.Provider.Schema>()).Concat(schemasLocal.ToSchema(latestVersion) ?? Enumerable.Empty<Domain.SSI.Models.Provider.Schema>()).ToList();
      if (results == null || results.Count == 0) return null;

      if (latestVersion)
      {
        // when latestVersion is true, group by name and select only the latest version from each group
        return results?
            .GroupBy(schema => schema.Name)
            .Select(g => g.OrderByDescending(s => s.Version).First())
            .Where(schema => schema != null)
            .ToList();
      }

      return results?.OrderBy(o => o.Name).ThenBy(o => o.Version).ToList();
    }

    public async Task<Domain.SSI.Models.Provider.Schema> GetSchemaByName(string name)
    {
      var result = await GetSchemaByNameOrNull(name) ?? throw new EntityNotFoundException($"{nameof(Domain.SSI.Models.Provider.Schema)} with name '{name}' does not exists");
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
      if (results == null || results.Count == 0) return null;

      //return the latest version; schema can exist in both "local" and Aries; latest version reflects the active version
      var result = results.OrderByDescending(o => o.Version).First();
      return result;
    }

    public async Task<Domain.SSI.Models.Provider.Schema> GetSchemaById(string id)
    {
      var result = await GetSchemaByIdOrNull(id) ?? throw new EntityNotFoundException($"{nameof(Domain.SSI.Models.Provider.Schema)} with id '{id}' does not exists");
      return result;
    }

    public async Task<Domain.SSI.Models.Provider.Schema?> GetSchemaByIdOrNull(string id)
    {
      if (string.IsNullOrWhiteSpace(id))
        throw new ArgumentNullException(nameof(id));
      id = id.Trim();

      var client = _clientFactory.CreateGovernanceClient();

      var schemaLocal = _credentialSchemaRepository.Query().Where(o => o.Id == id).SingleOrDefault();
      if (schemaLocal != null) return schemaLocal.ToSchema();

      ICollection<CredentialSchema>? schemasAries = null;
      try
      {
        schemasAries = await client.GetSchemasAsync(id);
      }
      catch (Aries.CloudAPI.DotnetSDK.AspCore.Clients.Exceptions.HttpClientException ex)
      {
        if (ex.StatusCode == System.Net.HttpStatusCode.UnprocessableEntity) return null;
        throw;
      }

      var results = (schemasAries.ToSchema(false) ?? Enumerable.Empty<Domain.SSI.Models.Provider.Schema>()).ToList();
      if (results == null || results.Count == 0) return null;

      if (results.Count > 1)
        throw new DataInconsistencyException($"More than one schema found with id '{id}' (specific version): {string.Join(", ", results.Select(o => $"{o.Name}:{o.ArtifactType}"))}");

      return results.SingleOrDefault();
    }

    public async Task<Domain.SSI.Models.Provider.Credential> GetCredentialById(string tenantId, string id)
    {
      if (string.IsNullOrWhiteSpace(id))
        throw new ArgumentNullException(nameof(id));
      id = id.Trim();

      var resultLocal = _credentialRepository.Query().SingleOrDefault(o => o.Id == Guid.Parse(id));
      if (resultLocal != null) return resultLocal.ToCredential();

      var client = _clientFactory.CreateTenantClient(tenantId);
      CredInfo? resultAries = null;
      try
      {
        resultAries = await client.GetCredentialByIdAsync(id);
      }
      catch (Aries.CloudAPI.DotnetSDK.AspCore.Clients.Exceptions.HttpClientException ex)
      {
        if (ex.StatusCode != System.Net.HttpStatusCode.NotFound) throw;
      }

      if (resultAries == null)
        throw new EntityNotFoundException($"{nameof(Domain.SSI.Models.Provider.Credential)} with id '{id}' does not exist");

      return resultAries.ToCredential();
    }

    //[int? start, int? count]: filter and ordered client side; no way to filter on schemaType or orderByDescending:_Date_Issued on Aries
    public async Task<List<Domain.SSI.Models.Provider.Credential>?> ListCredentials(string tenantId)
    {
      if (string.IsNullOrWhiteSpace(tenantId))
        throw new ArgumentNullException(nameof(tenantId));
      tenantId = tenantId.Trim();

      var client = _clientFactory.CreateTenantClient(tenantId);

      //var paginationEnabled = start.HasValue || count.HasValue;

      //anon credentials
      var anonCredentials = await client.GetCredentialsAsync();

      //jws credentials
      var query = _credentialRepository.Query().Where(o => o.TargetTenantId == tenantId && o.ArtifactType == ArtifactType.JWS.ToString());

      //query = query.OrderByDescending(o => o.DateCreated);
      //if (paginationEnabled)
      //{
      //    if (!start.HasValue || start.Value < default(int))
      //        throw new ArgumentOutOfRangeException(nameof(start), "Must be equal to or greater than 0");

      //    if (!count.HasValue || count.Value <= default(int))
      //        throw new ArgumentOutOfRangeException(nameof(count), "Must be greater than 0");

      //    query = query.Skip(start.Value).Take(count.Value);
      //}
      var jwsCredentials = query.ToList();

      var results = (anonCredentials?.Results?.Select(o => o.ToCredential()) ?? [])
          .Concat(jwsCredentials?.Select(o => o.ToCredential()) ?? []).ToList();

      return results;
    }

    public async Task<Domain.SSI.Models.Provider.Schema> UpsertSchema(SchemaRequest request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      if (request.Attributes != null) request.Attributes = [.. request.Attributes.Distinct()];
      if (request.Attributes == null || request.Attributes.Count == 0)
        throw new ArgumentException($"'{nameof(request.Attributes)}' is required", nameof(request));

      var schemaExisting = await GetSchemaByNameOrNull(request.Name);

      var version = VersionExtensions.Default;
      if (schemaExisting != null) version = schemaExisting.Version.IncrementMinor(); //allow switching of artifact stores; version incrementally incremented across stores

      switch (request.ArtifactType)
      {
        case ArtifactType.AnonCreds:
          var schemaCreateRequest = new CreateSchema
          {
            Name = request.Name,
            Version = version.ToString(),
            Attribute_names = request.Attributes
          };

          var client = _clientFactory.CreateGovernanceClient();
          var schemaAries = await client.CreateSchemaAsync(schemaCreateRequest);
          return schemaAries.ToSchema();

        case ArtifactType.JWS:
          var protocolVersion = Constants.ProtocolVersion.TrimStart('v').TrimStart('V');

          var credentialSchema = new Models.CredentialSchema
          {
            Id = $"{Schema_Prefix_JWT}:{protocolVersion}:{request.Name}:{version}",
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
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      if (string.IsNullOrWhiteSpace(request.Referent))
        throw new ArgumentException($"'{nameof(request.Referent)}' is required", nameof(request));
      request.Referent = request.Referent.Trim();

      if (string.IsNullOrWhiteSpace(request.Name))
        throw new ArgumentException($"'{nameof(request.Name)}' is required", nameof(request));
      request.Name = request.Name.Trim();

      if (request.Roles != null) request.Roles = [.. request.Roles.Distinct()];
      if (request.Roles == null || request.Roles.Count == 0)
        throw new ArgumentException($"'{nameof(request.Roles)}' is required", nameof(request));

      request.ImageUrl = request.ImageUrl?.Trim();
      Uri? imageUri = null;
      if (!string.IsNullOrEmpty(request.ImageUrl) && !Uri.TryCreate(request.ImageUrl, UriKind.Absolute, out imageUri))
        throw new ArgumentException($"'{nameof(request.ImageUrl)}' is required / invalid", nameof(request));

      var client = _clientFactory.CreateTenantAdminClient();

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

      var actor = await GetActorById(tenant.Wallet_id);
      if (actor != null) existingRoles.AddRange(actor.Roles.ToSSIRoles());

      var diffs = request.Roles.Except(existingRoles).ToList();
      if (diffs.Count != 0)
        throw new DataInconsistencyException(
            $"Role mismatched detected for tenant with label {tenant.Wallet_label} and id '{tenant.Wallet_id}'. Updating of tenant are not supported");

      return tenant.Wallet_id;
    }

    public async Task<string?> IssueCredential(CredentialIssuanceRequest request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

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
      if (request.Attributes == null || request.Attributes.Count == 0)
        throw new ArgumentException($"'{nameof(request.Attributes)}' is required", nameof(request));

      var schema = await GetSchemaByName(request.SchemaName);

      //validate specified attributes against schema
      var undefinedAttributes = request.Attributes.Keys.Except(schema.AttributeNames);
      if (undefinedAttributes.Any())
        throw new ArgumentException($"'{nameof(request.Attributes)}' contains attribute(s) not defined on the associated schema ('{request.SchemaName}'): '{string.Join(",", undefinedAttributes)}'");

      var clientTenantAdmin = _clientFactory.CreateTenantAdminClient();

      var tenantHolder = await clientTenantAdmin.GetTenantByIdAsync(wallet_id: request.TenantIdHolder);
      var clientHolder = _clientFactory.CreateTenantClient(tenantHolder.Wallet_id);

      //check if credential was issued based on clientReferent
      var result = await GetCredentialReferentByClientReferentOrNull(clientHolder, request.ArtifactType, request.ClientReferent, false);
      if (!string.IsNullOrEmpty(result)) return result;

      var tenantIssuer = await clientTenantAdmin.GetTenantByIdAsync(wallet_id: request.TenantIdIssuer);
      var clientIssuer = _clientFactory.CreateTenantClient(tenantIssuer.Wallet_id);

      var connection = await EnsureConnectionCI(tenantIssuer, clientIssuer, tenantHolder, clientHolder);

      SendCredential sendCredentialRequest;
      switch (request.ArtifactType)
      {
        case ArtifactType.AnonCreds:
          string definitionId;
          await _definitionLock.WaitAsync();
          try
          {
            definitionId = await EnsureDefinition(clientIssuer, schema);
          }
          finally
          {
            _definitionLock.Release();
          }

          sendCredentialRequest = new SendCredential
          {
            Connection_id = connection.SourceConnectionId,
            Anoncreds_credential_detail = new AnonCredsCredential
            {
              Credential_definition_id = definitionId,
              Attributes = request.Attributes
            }
          };

          await SendAndAcceptCredential(tenantHolder, clientHolder, clientIssuer, sendCredentialRequest);

          break;

        case ArtifactType.JWS:
          //get the issuer's public did
          var issuerPublicDid = await clientIssuer.GetPublicDIDAsync();

          //construct the signing request
          var signRequest = new JWSCreateRequest
          {
            Did = issuerPublicDid.Did,
            Payload = request.Attributes
          };

          var signedJWS = await clientIssuer.SignJWSAsync(signRequest);

          //store the credential in the "db" wallet; at time of implementation, Aries did not support storing of JWS credentials in the holder's wallet
          var credential = new Models.Credential
          {
            ClientReferent = request.ClientReferent.Value,
            SourceTenantId = request.TenantIdIssuer,
            TargetTenantId = request.TenantIdHolder,
            SchemaId = schema.Id,
            ArtifactType = request.ArtifactType.ToString(),
            Attributes = JsonConvert.SerializeObject(request.Attributes),
            SignedValue = JsonConvert.SerializeObject(signedJWS)
          };

          credential = await _credentialRepository.Create(credential);
          break;

        default:
          throw new InvalidOperationException($"Artifact type of '{request.ArtifactType}' not supported");
      }

      result = await GetCredentialReferentByClientReferentOrNull(clientHolder, request.ArtifactType, request.ClientReferent, true);
      return result;
    }
    #endregion

    #region Private Members
    private async Task SendAndAcceptCredential(Tenant tenantHolder, ITenantClient clientHolder, ITenantClient clientIssuer, SendCredential sendCredentialRequest)
    {
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

      // accept the credential by holder (aries cloud auto completes and store the credential in the holders wallet)
      var credentialExchange = await clientHolder.AcceptCredentialOfferByIdAsync(sseEvent.Payload.Credential_exchange_id);

      await Task.Run(async () =>
      {
        // await sse event on holders side (in order to ensure credential issuance is done) 
        sseEvent = await _sseListenerService.Listen<CredentialExchange>(tenantHolder.Wallet_id,
                Topic.Credentials, "credential_id", credentialExchange.Credential_exchange_id, CredentialExchangeState.Done.ToEnumMemberValue());
      });

      if (sseEvent == null)
        throw new InvalidOperationException($"Failed to receive SSE event for topic '{Topic.Credentials}' and desired state '{CredentialExchangeState.Done}'");
    }

    private static async Task<Tenant?> GetTenantByWalletNameOrNull(string walletName, ITenantAdminClient client)
    {
      var tenants = await client.GetTenantsAsync(wallet_name: walletName);

      if (tenants?.Count > 1)
        throw new InvalidOperationException($"More than one tenant found with wallet name '{walletName}'");

      return tenants?.SingleOrDefault();
    }

    private async Task<Tenant> GetTenantById(string id)
    {
      var clientTenantAdmin = _clientFactory.CreateTenantAdminClient();

      Tenant? tenant = null;
      try
      {
        tenant = await clientTenantAdmin.GetTenantByIdAsync(wallet_id: id);
      }
      catch (Aries.CloudAPI.DotnetSDK.AspCore.Clients.Exceptions.HttpClientException ex)
      {
        if (ex.StatusCode != System.Net.HttpStatusCode.NotFound) throw;
      }

      return tenant ?? throw new ArgumentOutOfRangeException(nameof(id), $"Tenant with id '{id}' does not exist");
    }

    private async Task<Actor?> GetActorById(string id)
    {
      var clientPublic = _clientFactory.CreatePublicClient();
      ICollection<Actor>? actors = null;
      try
      {
        actors = await clientPublic.GetTrustRegistryActorsAsync(null, id, null);
      }
      catch (Aries.CloudAPI.DotnetSDK.AspCore.Clients.Exceptions.HttpClientException ex)
      {
        if (ex.StatusCode != System.Net.HttpStatusCode.NotFound) throw;
      }

      if (actors?.Count > 1)
        throw new InvalidOperationException($"More than one actor found for tenant with id '{id}'");

      return actors?.SingleOrDefault();
    }

    /// <summary>
    /// Ensure a credential definition for the specified issuer and schema (applies to artifact type anonCreds)
    /// </summary>
    private static async Task<string> EnsureDefinition(ITenantClient clientIssuer, Domain.SSI.Models.Provider.Schema schema)
    {
      var tag = $"{schema.ArtifactType}:{schema.Name}:{schema.Version}";

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
      var results = _connectionRepository.Query()
          .Where(o =>
              o.SourceTenantId == tenantIssuer.Wallet_id &&
              o.TargetTenantId == tenantHolder.Wallet_id)
          .ToList();

      var result = results
          .OrderByDescending(o =>
              Enum.TryParse<Connection_protocol>(o.Protocol, true, out var parsedProtocol)
                  ? (int)parsedProtocol
                  : throw new InvalidOperationException($"Unknown protocol: {o.Protocol}"))
          .FirstOrDefault();

      Connection? connectionIssuer = null;
      if (result != null)
      {
        try
        {
          //ensure connected (active)
          connectionIssuer = await clientIssuer.GetConnectionByIdAsync(result.SourceConnectionId);

          if (connectionIssuer != null && string.Equals(connectionIssuer.State, ConnectionState.Completed.ToEnumMemberValue(), StringComparison.InvariantCultureIgnoreCase)) return result;

          await _connectionRepository.Delete(result);
        }
        catch (Aries.CloudAPI.DotnetSDK.AspCore.Clients.Exceptions.HttpClientException ex)
        {
          if (ex.StatusCode != System.Net.HttpStatusCode.NotFound) throw;
        }
      }

      //find the issuer actor on the trust registry in order to get the public did
      var clientPublic = _clientFactory.CreatePublicClient();
      var actorIssuer = (await clientPublic.GetTrustRegistryActorsAsync(actor_id: tenantIssuer.Wallet_id)).SingleOrDefault()
          ?? throw new InvalidOperationException($"Failed to retrieve actor with id (wallet id) '{tenantIssuer.Wallet_id}'");

      Connection? connectionHolder = null;
      WebhookEvent<Connection>? sseEvent = null;
      await Task.Run(async () =>
      {
        //create connection to issuer as holder; issuer auto accepts connection
        connectionHolder = await clientHolder.CreateDidExchangeRequestAsync(their_public_did: actorIssuer.Did, my_label: tenantHolder.Wallet_label);

        //await sse event on issuer's side (in order to retrieve the issuer connection id to the holder used to issue the credential)  
        sseEvent = await _sseListenerService.Listen<Connection>(tenantIssuer.Wallet_id,
                Topic.Connections, "their_did", connectionHolder.My_did, ConnectionState.Completed.ToEnumMemberValue());
      });

      if (connectionHolder == null)
        throw new InvalidOperationException($"Failed to create connection to the issuer as holder");

      if (sseEvent == null)
        throw new InvalidOperationException($"Failed to receive SSE event for topic '{Topic.Connections}' and desired state '{ConnectionState.Completed}'");

      result = new Models.Connection
      {
        SourceTenantId = tenantIssuer.Wallet_id,
        SourceConnectionId = sseEvent.Payload.Connection_id,
        TargetTenantId = tenantHolder.Wallet_id,
        TargetConnectionId = connectionHolder.Connection_id,
        Protocol = (connectionHolder.Connection_protocol?.ToString()) ?? throw new InvalidOperationException("Unable to obtain the required connection protocol")
      };

      result = await _connectionRepository.Create(result);

      return result;
    }

    private async Task<string?> GetCredentialReferentByClientReferentOrNull(ITenantClient clientHolder, ArtifactType artifactType,
        KeyValuePair<string, string> clientReferent, bool throwNotFound)
    {
      switch (artifactType)
      {
        case ArtifactType.AnonCreds:
          var wqlQueryString = $"{{\"attr::{clientReferent.Key}::value\":\"{clientReferent.Value}\"}}";

          var credsAnon = await clientHolder.GetCredentialsAsync(null, null, wqlQueryString);

          if (credsAnon?.Results?.Count > 1)
            throw new InvalidOperationException($"More than one credential found for client referent '{clientReferent}'");

          var credAnon = credsAnon?.Results?.SingleOrDefault();

          if (credAnon == null)
          {
            if (throwNotFound)
              throw new InvalidOperationException($"Credential expected but not found for client referent '{clientReferent}'");
            return null;
          }

          var resultAnon = credAnon?.Credential_id?.Trim();
          if (string.IsNullOrEmpty(resultAnon))
            throw new InvalidOperationException($"Credential id expected but is null / empty client referent '{clientReferent}'");
          return resultAnon;

        case ArtifactType.JWS:
          var credJWS = _credentialRepository.Query().SingleOrDefault(o => o.ClientReferent == clientReferent.Value);
          if (credJWS == null)
          {
            if (throwNotFound)
              throw new InvalidOperationException($"Credential expected but not found for client referent '{clientReferent}'");
            return null;
          }

          return credJWS.Id.ToString();

        default:
          throw new InvalidOperationException($"Artifact type of '{artifactType}' not supported");
      }
    }
    #endregion
  }
}
