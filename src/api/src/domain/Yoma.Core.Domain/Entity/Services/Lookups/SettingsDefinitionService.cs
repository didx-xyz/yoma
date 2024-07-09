using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models.Lookups;

namespace Yoma.Core.Domain.Entity.Services.Lookups
{
  public class SettingsDefinitionService : ISettingsDefinitionService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<SettingsDefinition> _settingsDefinitionRepository;
    #endregion

    #region Constructor
    public SettingsDefinitionService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<SettingsDefinition> settingsDefinitionRepository)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _settingsDefinitionRepository = settingsDefinitionRepository;
    }
    #endregion

    #region Public Members
    public List<SettingsDefinition> ListByEntityType(EntityType type)
    {
      return [.. List().Where(o => o.EntityType == type)];
    }
    #endregion

    #region Private Members

    private List<SettingsDefinition> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return [.. _settingsDefinitionRepository.Query()];

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<SettingsDefinition>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return _settingsDefinitionRepository.Query().ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(SettingsDefinition)}s'");
      return result;
    }
    #endregion
  }
}
