using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Marketplace.Interfaces.Lookups;

namespace Yoma.Core.Domain.Marketplace.Services.Lookups
{
  public class StoreAccessControlRuleStatusService : IStoreAccessControlRuleStatusService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<Models.Lookups.StoreAccessControlRuleStatus> _storeAccessControlRuleStatusRepository;
    #endregion

    #region Constructor
    public StoreAccessControlRuleStatusService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<Models.Lookups.StoreAccessControlRuleStatus> storeAccessControlRuleStatusRepository)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _storeAccessControlRuleStatusRepository = storeAccessControlRuleStatusRepository;
    }
    #endregion

    #region Public Members
    public Models.Lookups.StoreAccessControlRuleStatus GetByName(string name)
    {
      var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(Models.Lookups.StoreAccessControlRuleStatus)} with name '{name}' does not exists", nameof(name));
      return result;
    }

    public Models.Lookups.StoreAccessControlRuleStatus? GetByNameOrNull(string name)
    {
      if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentNullException(nameof(name));
      name = name.Trim();

      return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.InvariantCultureIgnoreCase));
    }

    public Models.Lookups.StoreAccessControlRuleStatus GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(Models.Lookups.StoreAccessControlRuleStatus)} with '{id}' does not exists", nameof(id));
      return result;
    }

    public Models.Lookups.StoreAccessControlRuleStatus? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<Models.Lookups.StoreAccessControlRuleStatus> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return [.. _storeAccessControlRuleStatusRepository.Query().OrderBy(o => o.Name)];

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<Models.Lookups.StoreAccessControlRuleStatus>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return _storeAccessControlRuleStatusRepository.Query().OrderBy(o => o.Name).ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(Models.Lookups.StoreAccessControlRuleStatus)}s'");
      return result;
    }
    #endregion
  }
}
