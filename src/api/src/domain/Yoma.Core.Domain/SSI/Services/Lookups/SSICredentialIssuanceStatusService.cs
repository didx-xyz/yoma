using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Services.Lookups
{
  public class SSICredentialIssuanceStatusService : ISSICredentialIssuanceStatusService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<SSICredentialIssuanceStatus> _ssiCredentialIssuanceStatusRepository;
    #endregion

    #region Constructor
    public SSICredentialIssuanceStatusService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<SSICredentialIssuanceStatus> ssiCredentialIssuanceStatusRepository)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _ssiCredentialIssuanceStatusRepository = ssiCredentialIssuanceStatusRepository;
    }
    #endregion

    #region Public Members
    public SSICredentialIssuanceStatus GetByName(string name)
    {
      var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(SSICredentialIssuanceStatus)} with name '{name}' does not exists", nameof(name));
      return result;
    }

    public SSICredentialIssuanceStatus? GetByNameOrNull(string name)
    {
      if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentNullException(nameof(name));
      name = name.Trim();

      return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.InvariantCultureIgnoreCase));
    }

    public SSICredentialIssuanceStatus GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(SSICredentialIssuanceStatus)} with '{id}' does not exists", nameof(id));
      return result;
    }

    public SSICredentialIssuanceStatus? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<SSICredentialIssuanceStatus> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return [.. _ssiCredentialIssuanceStatusRepository.Query().OrderBy(o => o.Name)];

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<SSICredentialIssuanceStatus>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return _ssiCredentialIssuanceStatusRepository.Query().OrderBy(o => o.Name).ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(SSICredentialIssuanceStatus)}s'");
      return result;
    }
    #endregion
  }
}

