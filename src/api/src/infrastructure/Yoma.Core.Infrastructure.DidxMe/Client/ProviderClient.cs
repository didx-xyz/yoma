using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Infrastructure.DidxMe.Interfaces;
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
    private const string OfferedStatus = "offered";
    private readonly ProviderOptions _options;
    private readonly IPresetService _presets;
    private readonly IHolderService _holder;
    private readonly IIssuerClient _issuer;
    private readonly IIssuanceTrackingService _tracking;
    private readonly IRepositoryValueContainsWithNavigation<User> _users;
    #endregion

    #region Constructor
    public ProviderClient(
      IOptions<ProviderOptions> options,
      IPresetService presets,
      IIssuerClient issuer,
      IIssuanceTrackingService tracking,
      IHolderService holder,
      IRepositoryValueContainsWithNavigation<User> users)
    {
      ArgumentNullException.ThrowIfNull(options, nameof(options));

      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
      _presets = presets ?? throw new ArgumentNullException(nameof(presets));
      _holder = holder ?? throw new ArgumentNullException(nameof(holder));
      _issuer = issuer ?? throw new ArgumentNullException(nameof(issuer));
      _tracking = tracking ?? throw new ArgumentNullException(nameof(tracking));
      _users = users ?? throw new ArgumentNullException(nameof(users));
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

      var context = await _holder.GetBackgroundContext(request.TenantIdHolder);
      var recovered = await _holder.GetCredentialByClientReferentOrNull(context, request.ArtifactType, request.ClientReferent);
      if (recovered != null)
      {
        // A retry may resolve a newer schema version than the successful original attempt.
        // Return the actual issued version; the domain records its schema and signed date.
        var recoveredSchema = PresetService.ToDomainSchema(_presets.GetMapping(recovered.SchemaId));
        if (recoveredSchema.Name != schema.Name || recoveredSchema.ArtifactType != schema.ArtifactType)
          throw new InvalidOperationException("The existing credential does not match the scheduled schema");

        return recovered;
      }

      var issuance = _tracking.Find(context.HolderId, request.ClientReferent);
      issuance ??= await _tracking.Create(new IssuanceMapping
      {
        Id = Guid.NewGuid(),
        TenantAlias = _options.TenantAlias,
        PresetMappingId = schema.Id,
        TenantIdIssuer = request.TenantIdIssuer.Trim(),
        TenantIdHolder = context.HolderId,
        ClientReferentKey = request.ClientReferent.Key,
        ClientReferentValue = request.ClientReferent.Value,
        Status = IssuanceStatus.Prepared.ToString()
      });

      if (issuance.PresetMappingId != schema.Id)
        throw new InvalidOperationException("The existing issuance attempt uses a different preset");

      // Persist the offer IDs before delivery. An unsaved offer cannot have reached the wallet.
      // Once delivery starts, an ambiguous result must recover the same credential, never issue another.
      IssuanceResponse offer;
      var status = Enum.Parse<IssuanceStatus>(issuance.Status, true);
      switch (status)
      {
        case IssuanceStatus.Prepared:
          var attributes = request.Attributes.Where(pair => !string.IsNullOrEmpty(pair.Value))
            .ToDictionary(pair => pair.Key, pair => pair.Value);
          offer = await _issuer.Issue(mapping.PresetId, attributes);
          ValidateOffer(offer);
          issuance = await _tracking.Update(issuance.Id, item =>
          {
            var itemStatus = Enum.Parse<IssuanceStatus>(item.Status, true);
            if (itemStatus != IssuanceStatus.Prepared)
              throw new InvalidOperationException("The issuance attempt changed while creating its offer; retry recovery");

            item.IssuanceId = offer.Id;
            item.IssuerCredentialId = offer.Credentials![0].Id;
            item.Status = IssuanceStatus.Offered.ToString();
          });
          break;

        case IssuanceStatus.Offered:
          offer = await _issuer.GetIssuance(issuance.IssuanceId!);
          ValidateOffer(offer);
          if (offer.Id != issuance.IssuanceId || offer.Credentials![0].Id != issuance.IssuerCredentialId)
            throw new InvalidOperationException("The resumed offer does not match the recorded issuance");
          break;

        case IssuanceStatus.Delivering:
        case IssuanceStatus.Accepted:
          throw new InvalidOperationException("Delivery already started but the credential is not present in the wallet; reconcile this attempt before retrying");

        default:
          throw new InvalidOperationException("The issuance attempt cannot be resumed from its current status");
      }

      await _tracking.Update(issuance.Id, item =>
      {
        var itemStatus = Enum.Parse<IssuanceStatus>(item.Status, true);

        // Check the current state under the journal row lock, not the earlier request snapshot.
        if (itemStatus != IssuanceStatus.Offered)
          throw new InvalidOperationException("The issuance attempt changed before delivery; retry recovery");

        item.Status = IssuanceStatus.Delivering.ToString();
      });

      // Even a 4xx can follow storage of a pending credential. Keep delivery errors in recovery.
      await _issuer.Deliver(context.UserId, offer.OfferUri!);
      await _tracking.Update(issuance.Id, item => item.DeliveryCompleted = true);

      // The webhook may arrive on another API instance, even before delivery returns.
      // Wait inline on its durable correlation; do not return an internal journal ID to the domain.
      var walletId = await _tracking.WaitForWalletId(issuance.Id);
      var credential = await _holder.GetCredential(context, walletId);
      if (credential == null || credential.SchemaId != schema.Id ||
        !credential.Attributes.TryGetValue(request.ClientReferent.Key, out var actualReferent) || actualReferent != request.ClientReferent.Value)
        throw new InvalidOperationException("The delivered wallet credential does not match the issuance request");

      return credential;
    }

    public Task<Credential> GetCredentialById(string tenantId, string id) => _holder.GetCredentialById(tenantId, id);

    public async Task<List<Credential>?> ListCredentials(string tenantId) => await _holder.ListCredentials(tenantId);

    public Task<Credential?> GetCredentialByClientReferentOrNull(string tenantId, ArtifactType artifactType,
      KeyValuePair<string, string> clientReferent) =>
      _holder.GetCredentialByClientReferentOrNull(tenantId, artifactType, clientReferent);

    public Task<Credential?> GetCredentialByIdOrNull(string tenantId, ArtifactType artifactType, string id) =>
      _holder.GetCredentialByIdOrNull(tenantId, artifactType, id);

    public bool SupportsCredentialRevocation(ArtifactType artifactType)
    {
      switch (artifactType)
      {
        case ArtifactType.SDJWT:
          return true;

        case ArtifactType.ACR:
        case ArtifactType.JWS:
          return false;

        default:
          throw new NotSupportedException($"Artifact type '{artifactType}' is not supported");
      }
    }

    public async Task RevokeCredential(string tenantId, ArtifactType artifactType, string id,
      KeyValuePair<string, string> clientReferent)
    {
      PresetService.ValidateArtifactType(artifactType);
      ArgumentException.ThrowIfNullOrWhiteSpace(tenantId);
      ArgumentException.ThrowIfNullOrWhiteSpace(id);

      var mapping = _tracking.Find(tenantId, clientReferent)
        ?? throw new InvalidOperationException("Revocation requires the original issuer tracking references");

      if (mapping.WalletCredentialId != id || string.IsNullOrWhiteSpace(mapping.IssuerCredentialId) ||
        string.IsNullOrWhiteSpace(mapping.IssuanceId))
        throw new InvalidOperationException("The credential's issuer and holder references are incomplete or inconsistent");

      var issuance = await _issuer.GetIssuance(mapping.IssuanceId);
      var credential = issuance.Credentials.Single(value => value.Id == mapping.IssuerCredentialId);
      var status = Enum.Parse<IssuerCredentialStatus>(credential.Status, true);

      switch (status)
      {
        case IssuerCredentialStatus.Revoked:
          return; // Remote success followed by a failed local save.

        case IssuerCredentialStatus.Issued:
          if (!credential.Revocable) throw new NotSupportedException("The issued credential cannot be revoked");
          break;

        case IssuerCredentialStatus.Offered:
          throw new NotSupportedException("The issued credential cannot be revoked");

        default:
          throw new NotSupportedException($"Issuer credential status '{status}' is not supported");
      }

      await _issuer.RevokeCredential(credential.Id);

      issuance = await _issuer.GetIssuance(mapping.IssuanceId);
      credential = issuance.Credentials.Single(value => value.Id == mapping.IssuerCredentialId);

      status = Enum.Parse<IssuerCredentialStatus>(credential.Status, true);

      switch (status)
      {
        case IssuerCredentialStatus.Revoked:
          break;

        case IssuerCredentialStatus.Offered:
        case IssuerCredentialStatus.Issued:
          throw new InvalidOperationException("Credential revocation has not been confirmed");

        default:
          throw new NotSupportedException($"Issuer credential status '{status}' is not supported");
      }
    }

    public Task DeleteCredential(string tenantId, ArtifactType artifactType, string id) =>
      _holder.DeleteCredential(tenantId, artifactType, id);
    #endregion

    #region Private Members
    private static void ValidateOffer(IssuanceResponse response)
    {
      if (string.IsNullOrWhiteSpace(response.Id) || string.IsNullOrWhiteSpace(response.OfferUri) ||
        response.Credentials?.Count != 1 || string.IsNullOrWhiteSpace(response.Credentials[0].Id) ||
        response.Credentials[0].Format != Constants.CredentialFormatIssuerSDJWT || response.Status != OfferedStatus)
        throw new InvalidOperationException("didx:me did not return the expected single SD-JWT issuance offer");
    }
    #endregion
  }
}
