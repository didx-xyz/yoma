using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces;
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
    private readonly ISyncProviderClientFactoryResolver _providerClientFactoryResolver;
    #endregion

    #region Constructor
    public SyncUserAuthenticationService(ILogger<SyncUserAuthenticationService> logger,
      ISyncStateService syncStateService,
      ICountryService countryService,
      ISyncProviderClientFactoryResolver providerClientFactoryResolver)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _syncStateService = syncStateService ?? throw new ArgumentNullException(nameof(syncStateService));
      _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
      _providerClientFactoryResolver = providerClientFactoryResolver ?? throw new ArgumentNullException(nameof(providerClientFactoryResolver));
    }
    #endregion

    #region Public Members
    /// <summary>
    /// Attempts to authenticate/link the user with each synchronized partner for the entity.
    ///
    /// This is best-effort only. If partner authentication fails, the existing default partner URL
    /// remains unchanged so the user can still navigate to the external opportunity manually.
    /// </summary>
    public async Task<SyncInfoEntity> Authenticate(Entity.Models.User user, SyncInfoEntity syncInfo)
    {
      ArgumentNullException.ThrowIfNull(user);
      ArgumentNullException.ThrowIfNull(syncInfo);

      var userSyncInfo = _syncStateService.ListUserSyncInfo(user.Id);
      var country = user.CountryId.HasValue ? _countryService.GetByIdOrNull(user.CountryId.Value) : null;

      foreach (var partner in syncInfo.Partners)
      {
        try
        {
          if (string.IsNullOrWhiteSpace(partner.ExternalId))
            throw new InvalidOperationException("Partner external id is required");

          var providerClient = _providerClientFactoryResolver.CreateClient<ISyncProviderClientUserAuthentication>(partner.Partner);

          var result = await providerClient.Authenticate(new SyncRequestUserAuthentication
          {
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            FirstName = user.FirstName,
            Surname = user.Surname,
            Country = country,
            EntitySyncInfo = partner,
            UserSyncInfo = userSyncInfo?.Partners.SingleOrDefault(o => o.Partner == partner.Partner)
          });

          if (string.IsNullOrWhiteSpace(result.URL))
            throw new InvalidOperationException("Authentication result URL is required");

          partner.URL = result.URL.Trim();

          if (result.UserSyncInfo == null)
            continue;

          if (result.UserSyncInfo.Partner != partner.Partner)
            throw new InvalidOperationException("Authentication result user sync partner does not match entity sync partner");

          result.UserSyncInfo.DateLastRedirect ??= DateTimeOffset.UtcNow;

          await _syncStateService.UpsertUserSyncInfo(
            user.Id,
            user.Username,
            user.Email,
            user.PhoneNumber,
            result.UserSyncInfo);
        }
        catch (Exception ex)
        {
          if (_logger.IsEnabled(LogLevel.Warning))
            _logger.LogWarning(ex,
              "Partner user authentication failed for partner '{partner}' and user '{userId}'. Keeping default navigation URL",
              partner.Partner, user.Id);
        }
      }

      return syncInfo;
    }
    #endregion
  }
}
