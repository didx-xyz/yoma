using Flurl;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;
using System.Net;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Infrastructure.DidxMe.Models;
using Yoma.Core.Infrastructure.DidxMe.Services;

namespace Yoma.Core.Infrastructure.DidxMe.Client
{
  /// <summary>
  /// Adapts didx:me presets, SD-JWT issuance and holder wallets to Yoma's SSI contract.
  /// Schema names remain at that compatibility boundary; preserving domain processes allows
  /// explicit Aries fallback, with that provider retaining its own ACR/JWS formats.
  /// Wallet Lite access is tenant-scoped, so this integration currently signs all credentials
  /// as Yoma. Organisation hashes satisfy domain tenant scheduling without remote issuer creation.
  /// Per-organisation signing and the required wallet visibility are future platform work.
  /// </summary>
  public class ProviderClient : ISSIProviderClient
  {
    #region Class Variables
    private readonly ProviderOptions _options;
    private readonly PresetService _presets;
    private readonly IssuerClient _issuer;
    private readonly WalletClient _wallet;
    private readonly HolderContextService _holderContext;
    private readonly BackgroundWalletService _background;
    private readonly IRepository<IssuanceMapping> _issuanceMappings;
    private readonly IRepositoryValueContainsWithNavigation<User> _users;
    private readonly IRepository<SSITenantCreation> _tenantCreations;
    #endregion

    #region Constructor
    public ProviderClient(
      IOptions<ProviderOptions> options,
      PresetService presets,
      IssuerClient issuer,
      WalletClient wallet,
      HolderContextService holderContext,
      BackgroundWalletService background,
      IRepository<IssuanceMapping> issuanceMappings,
      IRepositoryValueContainsWithNavigation<User> users,
      IRepository<SSITenantCreation> tenantCreations)
    {
      ArgumentNullException.ThrowIfNull(options, nameof(options));

      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
      _presets = presets ?? throw new ArgumentNullException(nameof(presets));
      _issuer = issuer ?? throw new ArgumentNullException(nameof(issuer));
      _wallet = wallet ?? throw new ArgumentNullException(nameof(wallet));
      _holderContext = holderContext ?? throw new ArgumentNullException(nameof(holderContext));
      _background = background ?? throw new ArgumentNullException(nameof(background));
      _issuanceMappings = issuanceMappings ?? throw new ArgumentNullException(nameof(issuanceMappings));
      _users = users ?? throw new ArgumentNullException(nameof(users));
      _tenantCreations = tenantCreations ?? throw new ArgumentNullException(nameof(tenantCreations));
    }
    #endregion

    #region Public Members
    public ArtifactType GetDefaultArtifactType(SchemaType schemaType) => schemaType switch
    {
      SchemaType.YoID or SchemaType.Opportunity => ArtifactType.SDJWT,
      _ => throw new NotSupportedException($"Schema type '{schemaType}' is not supported")
    };

    public Task<List<Schema>?> ListSchemas(bool latestVersion) =>
      Task.FromResult<List<Schema>?>(_presets.ListDomainSchemas(latestVersion));

    public Task<Schema> GetSchemaById(string id) =>
      Task.FromResult(PresetService.ToDomainSchema(_presets.GetMapping(id)));

    public Task<Schema?> GetSchemaByIdOrNull(string id)
    {
      var mapping = _presets.GetMappingOrNull(id);
      return Task.FromResult(mapping == null ? null : PresetService.ToDomainSchema(mapping));
    }

    public Task<Schema?> GetSchemaByNameOrNull(string name)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(name);

      return Task.FromResult(_presets.ListDomainSchemas(true).SingleOrDefault(schema => schema.Name == name.Trim()));
    }

    public async Task<Schema> GetSchemaByName(string name) =>
      await GetSchemaByNameOrNull(name) ?? throw new EntityNotFoundException("The Yoma schema has no didx:me preset mapping");

    public Task<Schema> UpsertSchema(SchemaRequest request) => _presets.UpsertPreset(request);

    /// <summary>
    /// Holders return their actual didx:me ID. All issuers, including the Yoma organisation, return
    /// the supplied organisation name hash/referent without remote provisioning. This is a local
    /// compatibility reference, not a didx:me organisation ID or tenant alias. Environment setup
    /// provisions the Yoma issuer; configured issuer authentication selects it for all issuance,
    /// regardless of the organisation referent passed by the domain.
    /// TODO: Revisit per-organisation issuers when didx:me supports the cross-tenant holder/wallet
    /// capabilities needed to retain a combined Yoma wallet view. Subject to future didx:me development.
    /// </summary>
    public async Task<string> EnsureTenant(TenantRequest request)
    {
      ArgumentNullException.ThrowIfNull(request);
      ArgumentException.ThrowIfNullOrWhiteSpace(request.Referent);
      ArgumentException.ThrowIfNullOrWhiteSpace(request.Name);

      if (request.Roles == null || request.Roles.Count == 0)
        throw new ArgumentException("At least one tenant role is required", nameof(request));

      foreach (var role in request.Roles)
      {
        switch (role)
        {
          case Role.Holder:
          case Role.Issuer:
          case Role.Verifier:
            break;
          default:
            throw new NotSupportedException($"Tenant role '{role}' is not supported");
        }
      }

      // Preserve the organisation name hash as a compatibility reference, not a remote issuer ID.
      // This no-op keeps existing domain scheduling intact; environment setup provisions Yoma.
      if (request.Roles.Contains(Role.Issuer)) return request.Referent.Trim();
      if (request.Roles.Any(role => role != Role.Holder))
        throw new NotSupportedException("Only holder or issuer tenants are supported");
      if (!Guid.TryParse(request.Referent, out var userId))
        throw new ArgumentException("A Yoma user referent is required", nameof(request));

      // Use the existing repository to avoid a dependency cycle through UserService -> SSI services.
      var user = _users.Query(false)
        .SingleOrDefault(user => user.Id == userId)
        ?? throw new EntityNotFoundException("The Yoma participant does not exist");
      if (!user.ExternalId.HasValue || user.ExternalId == Guid.Empty)
        throw new InvalidOperationException($"Cannot create didx:me holder for Yoma user '{user.Id}': ExternalId (Yoma Keycloak user ID) is missing");

      var externalId = user.ExternalId.Value.ToString();
      var holder = await _issuer.GetHolderOrNull(externalId);
      if (holder == null)
      {
        await _issuer.CreateHolder(externalId, $"{_options.TenantAlias}-{user.ExternalId.Value:N}",
          user.FirstName, user.Surname);
        holder = await _issuer.GetHolderOrNull(externalId)
          ?? throw new InvalidOperationException("didx:me onboarding did not establish the holder mapping");
      }

      await _issuer.EnableHolderLink(holder.Username);

      // The domain stores the provider's holder ID, just as it does with Aries. The Yoma
      // subject remains the external identifier used only to resolve the federation link.
      return Guid.Parse(holder.Id).ToString();
    }

    public async Task<Credential> IssueCredential(CredentialIssuanceRequest request)
    {
      ArgumentNullException.ThrowIfNull(request);
      ArgumentException.ThrowIfNullOrWhiteSpace(request.TenantIdIssuer);
      ArgumentException.ThrowIfNullOrWhiteSpace(request.TenantIdHolder);
      ArgumentException.ThrowIfNullOrWhiteSpace(request.ClientReferent.Key);
      ArgumentException.ThrowIfNullOrWhiteSpace(request.ClientReferent.Value);
      PresetService.ValidateArtifactType(request.ArtifactType);

      // The organisation referent is retained for correlation only. IssuerClient always signs as
      // the configured Yoma issuer; per-organisation signing awaits a supported Wallet Lite route.

      var mapping = _presets.GetMapping(request.SchemaId);
      var schema = PresetService.ToDomainSchema(mapping);
      if (schema.Name != request.SchemaName || schema.ArtifactType != request.ArtifactType)
        throw new ArgumentException("The requested schema identity/name/artifact type do not agree", nameof(request));
      if (request.Attributes == null || request.Attributes.Count == 0 ||
        request.Attributes.Keys.Except(schema.AttributeNames).Any())
        throw new ArgumentException("Credential attributes must belong to the exact requested schema", nameof(request));
      if (!request.Attributes.TryGetValue(request.ClientReferent.Key, out var referent) || referent != request.ClientReferent.Value)
        throw new ArgumentException("The signed client referent must match the issuance request", nameof(request));
      if (!Guid.TryParse(request.TenantIdHolder, out var holderSubject))
        throw new ArgumentException("A valid didx:me holder ID is required", nameof(request));

      var holderId = holderSubject.ToString();
      // Delivery accepts an external identifier, not a holder ID. Resolve the existing domain
      // tenant-to-user association without changing it or duplicating it in another store, then
      // verify the remote mapping before issuing. This also works without a participant session.
      var tenant = _tenantCreations.Query()
        .SingleOrDefault(item => item.TenantId == holderId && item.UserId.HasValue)
        ?? throw new InvalidOperationException("The didx:me holder has no Yoma participant tenant mapping");
      var user = _users.Query(false)
        .SingleOrDefault(item => item.Id == tenant.UserId)
        ?? throw new EntityNotFoundException("The Yoma participant does not exist");
      if (!user.ExternalId.HasValue || user.ExternalId == Guid.Empty)
        throw new InvalidOperationException($"Cannot issue to didx:me holder '{holderId}': the participant's ExternalId (Yoma Keycloak user ID) is missing");

      var externalId = user.ExternalId.Value.ToString();
      var holder = await _issuer.GetHolderOrNull(externalId)
        ?? throw new InvalidOperationException("The participant has not been onboarded into didx:me");
      if (Guid.Parse(holder.Id) != holderSubject)
        throw new InvalidOperationException("The linked didx:me holder does not match the participant's stored tenant ID");

      // TODO YOM-1309: the explicitly approved temporary recovery bypass can duplicate issuance
      // after a remote success/local-save failure. This journal does not solve that capability gap.
      var recovered = await _background.GetCredentialByClientReferentOrNull(holderId, request.ArtifactType, request.ClientReferent);
      if (recovered != null) return recovered;

      var issuance = await _issuanceMappings.Create(new IssuanceMapping
      {
        Id = Guid.NewGuid(),
        TenantAlias = _options.TenantAlias,
        PresetMappingId = schema.Id,
        TenantIdIssuer = request.TenantIdIssuer.Trim(),
        TenantIdHolder = holderId,
        ClientReferentKey = request.ClientReferent.Key,
        ClientReferentValue = request.ClientReferent.Value
      });
      var attributes = request.Attributes
        .Where(pair => !string.IsNullOrEmpty(pair.Value))
        .ToDictionary(pair => pair.Key, pair => pair.Value);
      var signedAttributes = new Dictionary<string, string>(attributes)
      {
        [PresetService.CredentialIdAttribute] = issuance.Id.ToString()
      };
      var response = await _issuer.Issue(mapping.PresetId, signedAttributes);
      if (string.IsNullOrWhiteSpace(response.Id) || string.IsNullOrWhiteSpace(response.OfferUri) ||
        response.Credentials?.Count != 1 || string.IsNullOrWhiteSpace(response.Credentials[0].Id) ||
        response.Credentials[0].Format != "sd-jwt-vc" || response.Status != "offered")
        throw new InvalidOperationException("didx:me did not return the expected single SD-JWT issuance offer");

      issuance.IssuanceId = response.Id;
      issuance.IssuerCredentialId = response.Credentials[0].Id;
      await _issuanceMappings.Update(issuance);

      await _issuer.Deliver(externalId, response.OfferUri);
      issuance.DeliveryCompleted = true;
      await _issuanceMappings.Update(issuance);

      return new Credential
      {
        Id = issuance.Id.ToString(),
        SchemaId = schema.Id,
        Attributes = attributes
      };
    }

    public async Task<Credential> GetCredentialById(string tenantId, string id)
    {
      if (!Guid.TryParse(id, out var issuanceId))
        throw new ArgumentException("A valid Yoma credential ID is required", nameof(id));

      var context = await _holderContext.Get(tenantId);
      var mapping = _issuanceMappings.Query()
        .SingleOrDefault(item => item.Id == issuanceId &&
          item.TenantAlias == _options.TenantAlias && item.TenantIdHolder == context.HolderId);

      if (mapping == null) throw new EntityNotFoundException("The credential does not belong to this wallet");

      if (mapping.WalletCredentialId != null)
      {
        try
        {
          var credential = await _wallet.GetCredential(context, mapping.WalletCredentialId);
          var result = await MapCredential(context.HolderId, credential);
          if (result?.Id != issuanceId.ToString()) throw new InvalidOperationException("The wallet credential correlation does not match");
          return result;
        }
        catch (HttpClientException exception) when (exception.StatusCode == HttpStatusCode.NotFound)
        {
          throw new EntityNotFoundException("The credential is no longer present in the holder wallet");
        }
      }

      return (await ListCredentials(context)).SingleOrDefault(item => item.Id == issuanceId.ToString())
        ?? throw new EntityNotFoundException("The credential is not present in the holder wallet");
    }

    public async Task<List<Credential>?> ListCredentials(string tenantId) =>
      await ListCredentials(await _holderContext.Get(tenantId));

    public Task<Credential?> GetCredentialByClientReferentOrNull(string tenantId, ArtifactType artifactType,
      KeyValuePair<string, string> clientReferent) =>
      _background.GetCredentialByClientReferentOrNull(tenantId, artifactType, clientReferent);

    public Task<Credential?> GetCredentialByIdOrNull(string tenantId, ArtifactType artifactType, string id) =>
      _background.GetCredentialByIdOrNull(tenantId, artifactType, id);

    public Task DeleteCredential(string tenantId, ArtifactType artifactType, string id) =>
      _background.DeleteCredential(tenantId, artifactType, id);
    #endregion

    #region Private Members
    private async Task<List<Credential>> ListCredentials(HolderContext context)
    {
      var result = new List<Credential>();
      var cursors = new HashSet<string>(StringComparer.Ordinal);
      var ids = new HashSet<string>(StringComparer.Ordinal);
      string? after = null;

      do
      {
        var page = await _wallet.ListCredentialPage(context, after);
        foreach (var item in page.Data!)
        {
          var mapped = await MapCredential(context.HolderId, item);
          if (mapped != null && ids.Add(mapped.Id)) result.Add(mapped);
        }

        after = null;
        if (page.Links?.TryGetValue("next", out var next) == true && !string.IsNullOrWhiteSpace(next))
        {
          // Extract only the cursor. Never follow a supplied URL with a participant bearer token.
          var query = QueryHelpers.ParseQuery(new Url(next).Query);
          if (!query.TryGetValue("page[after]", out var values) || values.Count != 1)
            throw new InvalidOperationException("didx:me returned an invalid wallet pagination cursor");
          after = values[0];
          if (string.IsNullOrWhiteSpace(after) || !cursors.Add(after))
            throw new InvalidOperationException("didx:me returned invalid or repeating wallet pagination");
        }
      } while (after != null);

      return result;
    }

    private async Task<Credential?> MapCredential(string tenantId, WalletCredential credential)
    {
      if (credential.Status != "accepted") throw new InvalidOperationException("Expected an accepted wallet credential");
      var presetMapping = _presets.GetMappingByVctOrNull(credential.Vct);
      if (presetMapping == null) return null; // Other credential types are not part of Yoma's domain catalogue.
      if (!Guid.TryParse(credential.Claims.Value<string>(PresetService.CredentialIdAttribute), out var id))
        throw new InvalidOperationException("The Yoma wallet credential is missing its signed correlation ID");
      var issuance = _issuanceMappings.Query()
        .SingleOrDefault(item => item.Id == id &&
          item.TenantAlias == _options.TenantAlias && item.TenantIdHolder == tenantId && item.PresetMappingId == presetMapping.Id)
        ?? throw new InvalidOperationException("The Yoma wallet credential has no matching issuance intent");
      if (credential.Claims.Value<string>(issuance.ClientReferentKey) != issuance.ClientReferentValue ||
        (issuance.WalletCredentialId != null && issuance.WalletCredentialId != credential.Id))
        throw new InvalidOperationException("The wallet credential does not match its issuance correlation");

      var attributes = new Dictionary<string, string>();
      foreach (var name in PresetService.ToDomainSchema(presetMapping).AttributeNames)
      {
        if (!credential.Claims.TryGetValue(name, out var claim)) continue;
        if (claim.Type != JTokenType.String)
          throw new InvalidOperationException("A Yoma credential contains a non-string domain attribute");
        attributes.Add(name, claim.Value<string>()!);
      }

      if (issuance.WalletCredentialId == null)
      {
        issuance.WalletCredentialId = credential.Id;
        await _issuanceMappings.Update(issuance);
      }

      return new Credential
      {
        Id = id.ToString(),
        SchemaId = presetMapping.Id,
        Attributes = attributes
      };
    }
    #endregion
  }
}
