using Flurl;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.WebUtilities;
using Newtonsoft.Json.Linq;
using System.Security.Claims;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Infrastructure.DidxMe.Interfaces;
using Yoma.Core.Infrastructure.DidxMe.Models;

namespace Yoma.Core.Infrastructure.DidxMe.Services
{
  /// <summary>
  /// Resolves holder ownership and maps wallet credentials for reads, recovery and Replay.
  /// Background authority is explicit; interactive authentication never falls back to it.
  /// </summary>
  public class HolderService : IHolderService
  {
    #region Class Variables
    private const string SubjectClaim = "sub";
    private const string BearerPrefix = Constants.HeaderAuthorizationValuePrefix + " ";
    private const string PaginationCursor = "page[after]";
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IIssuerClient _issuerClient;
    private readonly IWalletClient _wallet;
    private readonly IPresetService _presets;
    private readonly IIssuanceTrackingService _tracking;
    private readonly IRepositoryValueContainsWithNavigation<User> _userRepository;
    private readonly IRepository<SSITenantCreation> _tenantCreationRepository;
    #endregion

    #region Constructor
    public HolderService(IHttpContextAccessor httpContextAccessor, IIssuerClient issuerClient,
      IWalletClient wallet, IPresetService presets, IIssuanceTrackingService tracking,
      IRepositoryValueContainsWithNavigation<User> userRepository, IRepository<SSITenantCreation> tenantCreationRepository)
    {
      _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
      _issuerClient = issuerClient ?? throw new ArgumentNullException(nameof(issuerClient));
      _wallet = wallet ?? throw new ArgumentNullException(nameof(wallet));
      _presets = presets ?? throw new ArgumentNullException(nameof(presets));
      _tracking = tracking ?? throw new ArgumentNullException(nameof(tracking));
      _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
      _tenantCreationRepository = tenantCreationRepository ?? throw new ArgumentNullException(nameof(tenantCreationRepository));
    }
    #endregion

    #region Public Members
    /// <summary>
    /// Resolves a scheduled holder through Yoma's stored identity and verifies the remote link.
    /// Only explicit background operations use this route; interactive failures never fall back to it.
    /// </summary>
    public async Task<HolderContext> GetBackgroundContext(string tenantId)
    {
      if (!Guid.TryParse(tenantId, out var holderId))
        throw new ArgumentException("A valid didx:me holder ID is required", nameof(tenantId));

      var tenant = _tenantCreationRepository.Query()
        .SingleOrDefault(item => item.TenantId == holderId.ToString() && item.UserId.HasValue)
        ?? throw new InvalidOperationException("The didx:me holder has no Yoma participant tenant mapping");

      var user = _userRepository.Query(false).SingleOrDefault(item => item.Id == tenant.UserId)
        ?? throw new EntityNotFoundException("The Yoma participant does not exist");

      if (!user.ExternalId.HasValue || user.ExternalId == Guid.Empty)
        throw new InvalidOperationException("The participant's ExternalId (Yoma Keycloak user ID) is missing");

      var holder = await _issuerClient.GetHolderOrNull(user.ExternalId.Value.ToString())
        ?? throw new InvalidOperationException("The participant has not been onboarded into didx:me");

      if (Guid.Parse(holder.Id) != holderId)
        throw new InvalidOperationException("The linked didx:me holder does not match the participant's stored tenant ID");

      return new HolderContext
      {
        UserId = user.ExternalId.Value.ToString(),
        HolderId = holderId.ToString(),
        IsBackground = true
      };
    }

    public async Task<Credential> GetCredentialById(string tenantId, string id) =>
      await GetCredential(await GetContext(tenantId), id);

    public async Task<Credential> GetCredential(HolderContext context, string id) =>
      Map(await _wallet.GetCredential(context, id))
        ?? throw new EntityNotFoundException("The credential has no Yoma preset mapping");

    public async Task<List<Credential>> ListCredentials(string tenantId) =>
      [.. (await List(await GetContext(tenantId))).Select(Map).OfType<Credential>()];

    public async Task<Credential?> GetCredentialByClientReferentOrNull(string tenantId, ArtifactType artifactType,
      KeyValuePair<string, string> clientReferent)
    {
      PresetService.ValidateArtifactType(artifactType);
      ArgumentException.ThrowIfNullOrWhiteSpace(clientReferent.Key);
      ArgumentException.ThrowIfNullOrWhiteSpace(clientReferent.Value);

      var context = await GetBackgroundContext(tenantId);
      return await GetCredentialByClientReferentOrNull(context, artifactType, clientReferent);
    }

    public async Task<Credential?> GetCredentialByClientReferentOrNull(HolderContext context, ArtifactType artifactType,
      KeyValuePair<string, string> clientReferent)
    {
      ArgumentNullException.ThrowIfNull(context);
      PresetService.ValidateArtifactType(artifactType);
      ArgumentException.ThrowIfNullOrWhiteSpace(clientReferent.Key);
      ArgumentException.ThrowIfNullOrWhiteSpace(clientReferent.Value);

      var matches = new List<WalletCredential>();
      foreach (var status in Enum.GetValues<WalletCredentialStatus>())
      {
        var credentials = await List(context, status);
        matches.AddRange(credentials.Where(item => item.Claims[clientReferent.Key]?.Type == JTokenType.String &&
          item.Claims.Value<string>(clientReferent.Key) == clientReferent.Value));
      }

      if (matches.Count > 1)
        throw new InvalidOperationException("Multiple wallet credentials match the client referent; reconcile them before retrying");

      if (matches.Count == 0) return null;

      // Pending/rejected entries must not be reported as issued or as absent. They need resolution first.
      var result = Map(matches[0])
        ?? throw new InvalidOperationException("The matching wallet credential has no Yoma preset mapping");
      // Recovery can restore the domain's native wallet ID without a journal. Do not invent
      // issuer/session history when no local attempt survived; preset mapping remains required.
      var mapping = _tracking.Find(context.HolderId, clientReferent);
      if (mapping != null)
      {
        if (mapping.PresetMappingId != result.SchemaId)
          throw new InvalidOperationException("The recovered credential does not match its recorded preset");

        await _tracking.Update(mapping.Id, item =>
        {
          var status = Enum.Parse<IssuanceStatus>(item.Status, true);
          if (status == IssuanceStatus.Deleted)
            throw new InvalidOperationException("The issuance was deleted during recovery");

          if (item.WalletCredentialId != null && item.WalletCredentialId != result.Id)
            throw new InvalidOperationException("The recovered wallet ID conflicts with the recorded credential");

          item.WalletCredentialId = result.Id;
          item.Status = IssuanceStatus.Accepted.ToString();
        });
      }
      return result;
    }

    public async Task<Credential?> GetCredentialByIdOrNull(string tenantId, ArtifactType artifactType, string id)
    {
      PresetService.ValidateArtifactType(artifactType);
      var context = await GetBackgroundContext(tenantId);
      var credential = await _wallet.GetCredentialByIdOrNull(context, id);
      if (credential == null)
      {
        // Replay may retry after remote deletion succeeded but saving the local journal failed.
        await _tracking.ConfirmDeleted(context.HolderId, id);
        return null;
      }

      return Map(credential)
        ?? throw new InvalidOperationException("The wallet credential has no Yoma preset mapping");
    }

    public async Task DeleteCredential(string tenantId, ArtifactType artifactType, string id)
    {
      PresetService.ValidateArtifactType(artifactType);
      var context = await GetBackgroundContext(tenantId);
      var credential = await _wallet.GetCredentialByIdOrNull(context, id);
      if (credential != null)
      {
        if (Map(credential) == null)
          throw new InvalidOperationException("Only credentials with a Yoma preset mapping can be deleted");

        await _wallet.DeleteCredential(context, id);
        if (await _wallet.GetCredentialByIdOrNull(context, id) != null)
          throw new InvalidOperationException("The deleted credential is still present in the holder wallet");
      }

      // A failed local save is recoverable: a retry observes the same wallet absence before marking it.
      await _tracking.ConfirmDeleted(context.HolderId, id);
    }

    public async Task<HolderContext> GetContext(string tenantId)
    {
      var context = _httpContextAccessor.HttpContext;
      if (context?.User.Identity?.IsAuthenticated != true)
        throw new UnauthorizedAccessException("An authenticated Yoma participant is required for wallet access");

      var subject = context.User.FindFirstValue(SubjectClaim) ?? context.User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!Guid.TryParse(subject, out var subjectId) || !Guid.TryParse(tenantId, out var holderId))
        throw new UnauthorizedAccessException("The requested wallet does not belong to the authenticated participant");

      var authorization = context.Request.Headers.Authorization.ToString();
      if (!authorization.StartsWith(BearerPrefix, StringComparison.OrdinalIgnoreCase))
        throw new UnauthorizedAccessException("A Yoma bearer token is required for federation");

      var holder = await _issuerClient.GetHolderOrNull(subjectId.ToString())
        ?? throw new InvalidOperationException("The participant has not been onboarded into didx:me");
      if (Guid.Parse(holder.Id) != holderId)
        throw new UnauthorizedAccessException("The requested wallet does not belong to the authenticated participant");

      return new HolderContext
      {
        AccessToken = authorization[BearerPrefix.Length..].Trim(),
        UserId = subject!,
        HolderId = holderId.ToString()
      };
    }
    #endregion

    #region Private Members
    private async Task<List<WalletCredential>> List(HolderContext context, WalletCredentialStatus status = WalletCredentialStatus.Accepted)
    {
      var result = new List<WalletCredential>();
      var ids = new HashSet<string>(StringComparer.Ordinal);
      var cursors = new HashSet<string>(StringComparer.Ordinal);
      string? after = null;

      do
      {
        var page = await _wallet.ListCredentialPage(context, after, status: status);
        foreach (var item in page.Data!)
        {
          if (!Enum.TryParse<WalletCredentialStatus>(item.Status, true, out var actualStatus) || actualStatus != status)
            throw new InvalidOperationException("The wallet returned a credential with an unexpected status");

          if (ids.Add(item.Id)) result.Add(item);
        }

        after = null;
        if (page.Links?.TryGetValue("next", out var next) == true && !string.IsNullOrWhiteSpace(next))
        {
          // Extract only the cursor; never forward a participant token to a response-supplied URL.
          var query = QueryHelpers.ParseQuery(new Url(next).Query);
          if (!query.TryGetValue(PaginationCursor, out var values) || values.Count != 1)
            throw new InvalidOperationException("didx:me returned an invalid wallet pagination cursor");

          after = values[0];
          if (string.IsNullOrWhiteSpace(after) || !cursors.Add(after))
            throw new InvalidOperationException("didx:me returned invalid or repeating wallet pagination");
        }
      } while (after != null);

      return result;
    }

    private Credential? Map(WalletCredential credential)
    {
      if (!string.Equals(credential.Status, nameof(WalletCredentialStatus.Accepted), StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("Expected an accepted wallet credential");

      var presetMapping = _presets.GetMappingByVctOrNull(credential.Vct);
      if (presetMapping == null) return null;

      if (credential.DateIssued == null)
        throw new InvalidOperationException("Wallet credential response is incomplete");

      if (credential.Format != Constants.CredentialFormatSDJWT)
        throw new NotSupportedException("Only SD-JWT wallet credentials are supported by this adapter");

      var attributes = new Dictionary<string, string>();
      foreach (var name in PresetService.ToDomainSchema(presetMapping).AttributeNames)
      {
        if (!credential.Claims.TryGetValue(name, out var claim)) continue;

        if (claim.Type != JTokenType.String)
          throw new InvalidOperationException("A Yoma credential contains a non-string domain attribute");

        attributes.Add(name, claim.Value<string>()!);
      }

      return new Credential
      {
        Id = credential.Id,
        SchemaId = presetMapping.Id,
        Attributes = attributes
      };
    }
    #endregion
  }
}
