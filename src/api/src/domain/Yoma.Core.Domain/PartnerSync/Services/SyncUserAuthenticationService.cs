using FluentValidation;
using FluentValidation.Results;
using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Domain.PartnerSync.Models.Lookups;

namespace Yoma.Core.Domain.PartnerSync.Services
{
  public sealed class SyncUserAuthenticationService : ISyncUserAuthenticationService
  {
    #region Class Variables
    private readonly ILogger<SyncUserAuthenticationService> _logger;
    private readonly ISyncStateService _syncStateService;
    private readonly ICountryService _countryService;
    private readonly IPartnerService _partnerService;
    private readonly ISyncProviderClientFactoryResolver _providerClientFactoryResolver;
    #endregion

    #region Constructor
    public SyncUserAuthenticationService(ILogger<SyncUserAuthenticationService> logger,
      ISyncStateService syncStateService,
      ICountryService countryService,
      IPartnerService partnerService,
      ISyncProviderClientFactoryResolver providerClientFactoryResolver)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _syncStateService = syncStateService ?? throw new ArgumentNullException(nameof(syncStateService));
      _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
      _partnerService = partnerService ?? throw new ArgumentNullException(nameof(partnerService));
      _providerClientFactoryResolver = providerClientFactoryResolver ?? throw new ArgumentNullException(nameof(providerClientFactoryResolver));
    }
    #endregion

    #region Public Members
    /// <summary>
    /// Attempts to authenticate/link the user with the synchronized partner for the supplied entity sync information.
    ///
    /// This method owns the sync eligibility rules for partner user authentication:
    /// - Push-synced entities are Yoma/source-owned for navigation purposes, so there is no partner URL to enhance.
    /// - Pull-synced entities are partner-owned and may return an external partner URL.
    /// - Partner user authentication only runs when the partner is explicitly configured with SyncScope.UserAuthentication.
    /// </summary>
    public async Task<SyncInfoEntityPartner?> Authenticate(Entity.Models.User user, SyncInfoEntity? syncInfo)
    {
      ArgumentNullException.ThrowIfNull(user);

      if (syncInfo == null) return null;

      // Push sync means Yoma shared the entity out to a partner.
      // The entity remains Yoma/source-owned from a navigation point of view,
      // so user-authentication / auto-login URL enhancement does not apply.
      if (syncInfo.SyncType != SyncType.Pull) return null;

      // Pull sync means the entity came from an external partner.
      // For a pull-synced entity we expect exactly one source partner, because that partner owns
      // the external URL and any optional authentication/redirect enhancement for this entity.
      if (syncInfo.Partners == null || syncInfo.Partners.Count != 1)
        throw new DataInconsistencyException($"Pull-synced entity must have exactly one synchronized partner. Sync type: '{syncInfo.SyncType}'");

      return await Authenticate(user, syncInfo.Partners.Single());
    }
    #endregion

    #region Private Members
    /// <summary>
    /// Attempts to authenticate/link the user with the configured synchronized partner.
    ///
    /// Missing required profile fields produce a validation response for the UI to resolve.
    /// Otherwise this is best-effort: if partner authentication is not configured, supported, or fails,
    /// the existing default partner URL remains unchanged so the user can still navigate
    /// to the external opportunity manually.
    /// </summary>
    private async Task<SyncInfoEntityPartner> Authenticate(Entity.Models.User user, SyncInfoEntityPartner partnerSyncInfo)
    {
      ArgumentNullException.ThrowIfNull(user);
      ArgumentNullException.ThrowIfNull(partnerSyncInfo);

      var partner = _partnerService.GetByName(partnerSyncInfo.Partner.ToString());

      if (!IsUserAuthenticationEnabled(partner, partnerSyncInfo))
      {
        if (_logger.IsEnabled(LogLevel.Debug))
          _logger.LogDebug(
            "Partner user authentication skipped for partner '{partner}', entity type '{entityType}' and user '{userId}' because SyncScope.UserAuthentication is not configured",
            partnerSyncInfo.Partner, partnerSyncInfo.EntityType, user.Id);

        return partnerSyncInfo;
      }

      try
      {
        if (string.IsNullOrWhiteSpace(partnerSyncInfo.ExternalId))
          throw new InvalidOperationException("Partner external id is required");

        var userSyncInfo = _syncStateService.GetUserSyncInfo(user.Id);
        var country = user.CountryId.HasValue ? _countryService.GetByIdOrNull(user.CountryId.Value) : null;

        var request = new SyncRequestUserAuthentication
        {
          UserId = user.Id,
          Username = user.Username,
          Email = user.Email,
          PhoneNumber = user.PhoneNumber,
          FirstName = user.FirstName,
          Surname = user.Surname,
          Country = country,
          EntitySyncInfo = partnerSyncInfo,
          UserSyncInfo = userSyncInfo?.Partners.SingleOrDefault(o => o.Partner == partnerSyncInfo.Partner)
        };

        // Validate before constructing/calling the provider. These errors must reach the UI,
        // rather than silently falling back to a URL without the required user hand-off.
        ValidateUserProfile(request);

        var providerClient = _providerClientFactoryResolver.CreateClient<ISyncProviderClientUserAuthentication>(
          partnerSyncInfo.Partner);
        var result = await providerClient.Authenticate(request);

        if (string.IsNullOrWhiteSpace(result.URL))
          throw new InvalidOperationException("Authentication result URL is required");

        if (result.UserSyncInfo != null)
        {
          if (result.UserSyncInfo.Partner != partnerSyncInfo.Partner)
            throw new InvalidOperationException("Authentication result user sync partner does not match entity sync partner");

          result.UserSyncInfo.DateLastRedirect ??= DateTimeOffset.UtcNow;

          await _syncStateService.UpsertUserSyncInfo(
            user.Id,
            result.UserSyncInfo);
        }

        partnerSyncInfo.URL = result.URL.Trim();
      }
      catch (Exception ex) when (ex is not ValidationException)
      {
        if (_logger.IsEnabled(LogLevel.Warning))
          _logger.LogWarning(ex,
            "Partner user authentication failed for partner '{partner}', entity type '{entityType}' and user '{userId}'. Keeping default navigation URL",
            partnerSyncInfo.Partner, partnerSyncInfo.EntityType, user.Id);
      }

      return partnerSyncInfo;
    }

    /// <summary>
    /// Validates only fields required by the selected partner authentication path, not general
    /// Yoma onboarding. Email-less redirects remain supported; linked Alison login needs no
    /// registration profile. Partners without these requirements retain their current behaviour.
    /// </summary>
    private static void ValidateUserProfile(SyncRequestUserAuthentication request)
    {
      if (string.IsNullOrWhiteSpace(request.Email)) return;

      switch (request.EntitySyncInfo.Partner)
      {
        case SyncPartner.Alison when request.UserSyncInfo?.IsLinked != true:
        case SyncPartner.IXO:
          break;
        default:
          return;
      }

      var errors = new List<ValidationFailure>();
      var partner = request.EntitySyncInfo.Partner;
      if (string.IsNullOrWhiteSpace(request.FirstName))
        errors.Add(new ValidationFailure(nameof(request.FirstName),
          $"Please complete your Yoma profile: first name is required to continue to {partner}."));
      if (string.IsNullOrWhiteSpace(request.Surname))
        errors.Add(new ValidationFailure(nameof(request.Surname),
          $"Please complete your Yoma profile: surname is required to continue to {partner}."));
      if (request.Country == null)
        errors.Add(new ValidationFailure(nameof(request.Country),
          $"Please complete your Yoma profile: country is required to continue to {partner}."));

      if (errors.Count > 0) throw new ValidationException(errors);
    }

    /// <summary>
    /// Returns whether the partner is configured to support user authentication for the entity type.
    ///
    /// UserAuthentication is checked independently from Entity synchronization. Some partners may support
    /// authentication/redirect enhancement for an entity type without necessarily syncing that entity itself.
    /// </summary>
    private static bool IsUserAuthenticationEnabled(Partner partner, SyncInfoEntityPartner partnerSyncInfo)
    {
      if (!partner.SyncCapabilitiesParsed.TryGetValue(SyncType.Pull, out var entityCapabilities))
        return false;

      if (!entityCapabilities.TryGetValue(partnerSyncInfo.EntityType, out var scopes))
        return false;

      return scopes.Contains(SyncScope.UserAuthentication);
    }
    #endregion
  }
}
