using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Helpers;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Lookups.Services
{
  public class TimeIntervalService : ITimeIntervalService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<TimeInterval> _timeIntervalRepository;
    #endregion

    #region Constructor
    public TimeIntervalService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<TimeInterval> timeIntervalRepository)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _timeIntervalRepository = timeIntervalRepository;
    }
    #endregion

    #region Public Members
    public TimeInterval GetByName(string name)
    {
      var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(TimeInterval)} with name '{name}' does not exists", nameof(name));
      return result;
    }

    public TimeInterval? GetByNameOrNull(string name)
    {
      if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentNullException(nameof(name));
      name = name.Trim();

      return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.InvariantCultureIgnoreCase));
    }

    public TimeInterval GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(TimeInterval)} with '{id}' does not exists", nameof(id));
      return result;
    }

    public TimeInterval? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<TimeInterval> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
      {
        var items = _timeIntervalRepository.Query().ToList();
        return items.OrderBy(o => TimeIntervalHelper.GetOrder(o.Name)).ToList();
      }

      var result = _memoryCache.GetOrCreate(nameof(TimeInterval), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        var items = _timeIntervalRepository.Query().ToList();
        return items.OrderBy(o => TimeIntervalHelper.GetOrder(o.Name)).ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(TimeInterval)}s'");
      return result;
    }
    #endregion
  }
}
