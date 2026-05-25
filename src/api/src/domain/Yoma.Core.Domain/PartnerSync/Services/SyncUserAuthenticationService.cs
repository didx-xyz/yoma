using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Services
{
  public sealed class SyncUserAuthenticationService : ISyncUserAuthenticationService
  {
    #region Class Variables
    private readonly ISyncStateService _syncStateService;
    private readonly ISyncProviderClientFactoryResolver _providerClientFactoryResolver;
    #endregion

    #region Constructor
    public SyncUserAuthenticationService(ISyncStateService syncStateService,
      ISyncProviderClientFactoryResolver providerClientFactoryResolver)
    {
      _syncStateService = syncStateService ?? throw new ArgumentNullException(nameof(syncStateService));
      _providerClientFactoryResolver = providerClientFactoryResolver ?? throw new ArgumentNullException(nameof(providerClientFactoryResolver));
    }
    #endregion

    #region Public Members
    public async Task<SyncInfoEntity> Authenticate(Entity.Models.User user, SyncInfoEntity? syncInfo)
    {
      ArgumentNullException.ThrowIfNull(syncInfo);
      ArgumentNullException.ThrowIfNull(user);

      var userSyncInfo = _syncStateService.ListUserSyncInfo(user.Id);

      foreach (var partner in syncInfo.Partners)
      {
        if (string.IsNullOrWhiteSpace(partner.ExternalId))
          throw new InvalidOperationException($"Partner external id is required for user authentication for partner '{partner.Partner}'");

        var providerClient = _providerClientFactoryResolver.CreateClient<ISyncProviderClientUserAuthentication>(partner.Partner);

        var result = await providerClient.Authenticate(new SyncRequestUserAuthentication
        {
          UserId = user.Id,
          Username = user.Username,
          Email = user.Email,
          PhoneNumber = user.PhoneNumber,
          FirstName = user.FirstName,
          Surname = user.Surname,
          EntitySyncInfo = partner,
          UserSyncInfo = userSyncInfo?.Partners.SingleOrDefault(o => o.Partner == partner.Partner)
        });

        if (string.IsNullOrWhiteSpace(result.URL))
          throw new InvalidOperationException($"Authentication result URL is required for partner '{partner.Partner}'");

        ArgumentNullException.ThrowIfNull(result.UserSyncInfo);

        if (result.UserSyncInfo.Partner != partner.Partner)
          throw new InvalidOperationException($"Authentication result user sync partner '{result.UserSyncInfo.Partner}' does not match entity sync partner '{partner.Partner}'");

        result.UserSyncInfo.DateLastRedirect ??= DateTimeOffset.UtcNow;

        partner.URL = result.URL.Trim();

        await _syncStateService.UpsertUserSyncInfo(
          user.Id,
          user.Username,
          user.Email,
          user.PhoneNumber,
          result.UserSyncInfo);
      }

      return syncInfo;
    }
    #endregion
  }
}
