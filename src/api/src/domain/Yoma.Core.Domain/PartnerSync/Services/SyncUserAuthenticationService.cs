using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSync.Models;

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
    /// Attempts to authenticate/link the user with the synchronized partner for the entity.
    ///
    /// This is best-effort only. If partner authentication is not supported or fails,
    /// the existing default partner URL remains unchanged so the user can still navigate
    /// to the external opportunity manually.
    /// </summary>
    public async Task<SyncInfoEntityPartner> Authenticate(Entity.Models.User user, SyncInfoEntityPartner partnerSyncInfo)
    {
      ArgumentNullException.ThrowIfNull(user);
      ArgumentNullException.ThrowIfNull(partnerSyncInfo);

      try
      {
        if (string.IsNullOrWhiteSpace(partnerSyncInfo.ExternalId))
          throw new InvalidOperationException("Partner external id is required");

        var partner = _partnerService.GetByName(partnerSyncInfo.Partner.ToString());

        var pullOpportunityEnabled = partner.SyncCapabilitiesParsed.TryGetValue(SyncType.Pull, out var entityCapabilities) &&
          entityCapabilities.TryGetValue(EntityType.Opportunity, out var scopes) &&
          scopes.Contains(SyncScope.Entity);

        if (!pullOpportunityEnabled)
          throw new InvalidOperationException(
            $"Partner '{partner.Name}' is not configured for pull opportunity synchronization and cannot be used for partner user authentication");

        // TODO: Replace this hardcoded user-authentication support switch with a dedicated
        // partner capability, e.g. SyncScope.UserAuthentication, once supported in Partner.SyncCapabilities.
        // Pull opportunity capability is already validated above; this switch only decides whether
        // the pull partner can enhance the default partner URL with user authentication / auto-login.
        // Jobberman is pull-enabled, but does not support user authentication, so it keeps the default URL.
        switch (partnerSyncInfo.Partner)
        {
          case SyncPartner.Jobberman:
            if (_logger.IsEnabled(LogLevel.Debug))
              _logger.LogDebug(
                "Partner user authentication skipped for partner '{partner}' and user '{userId}' because user authentication is not supported",
                partnerSyncInfo.Partner, user.Id);

            return partnerSyncInfo;

          case SyncPartner.Alison:
            // Alison supports user authentication / auto-login navigation.
            break;

          default:
            throw new InvalidOperationException($"Unsupported sync partner '{partnerSyncInfo.Partner}'");
        }

        var userSyncInfo = _syncStateService.ListUserSyncInfo(user.Id);
        var country = user.CountryId.HasValue ? _countryService.GetByIdOrNull(user.CountryId.Value) : null;

        var providerClient = _providerClientFactoryResolver.CreateClient<ISyncProviderClientUserAuthentication>(partnerSyncInfo.Partner);

        var result = await providerClient.Authenticate(new SyncRequestUserAuthentication
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
        });

        if (string.IsNullOrWhiteSpace(result.URL))
          throw new InvalidOperationException("Authentication result URL is required");

        if (result.UserSyncInfo != null)
        {
          if (result.UserSyncInfo.Partner != partnerSyncInfo.Partner)
            throw new InvalidOperationException("Authentication result user sync partner does not match entity sync partner");

          result.UserSyncInfo.DateLastRedirect ??= DateTimeOffset.UtcNow;

          await _syncStateService.UpsertUserSyncInfo(
            user.Id,
            user.Username,
            user.Email,
            user.PhoneNumber,
            result.UserSyncInfo);
        }

        partnerSyncInfo.URL = result.URL.Trim();
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Warning))
          _logger.LogWarning(ex,
            "Partner user authentication failed for partner '{partner}' and user '{userId}'. Keeping default navigation URL",
            partnerSyncInfo.Partner, user.Id);
      }

      return partnerSyncInfo;
    }
    #endregion
  }
}
