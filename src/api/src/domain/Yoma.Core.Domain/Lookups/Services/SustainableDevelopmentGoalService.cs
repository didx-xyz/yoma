using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Lookups.Services
{
  public class SustainableDevelopmentGoalService : ISustainableDevelopmentGoalService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<SustainableDevelopmentGoal> _repository;
    #endregion

    #region Constructor
    public SustainableDevelopmentGoalService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<SustainableDevelopmentGoal> repository)
    {
      _appSettings = appSettings?.Value ?? throw new ArgumentNullException(nameof(appSettings));
      _memoryCache = memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));
      _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }
    #endregion

    #region Public Members
    public SustainableDevelopmentGoal GetByName(string name)
    {
      return GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(SustainableDevelopmentGoal)} with name '{name}' does not exist", nameof(name));
    }

    public SustainableDevelopmentGoal? GetByNameOrNull(string name)
    {
      if (string.IsNullOrWhiteSpace(name)) throw new ArgumentNullException(nameof(name));

      name = name.Trim();

      return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.OrdinalIgnoreCase));
    }

    public SustainableDevelopmentGoal GetById(Guid id)
    {
      return GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(SustainableDevelopmentGoal)} with id '{id}' does not exist", nameof(id));
    }

    public SustainableDevelopmentGoal? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty) throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<SustainableDevelopmentGoal> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return [.. _repository.Query().OrderBy(o => o.Number)];

      return _memoryCache.GetOrCreate(CacheHelper.GenerateKey<SustainableDevelopmentGoal>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);

        return _repository.Query().OrderBy(o => o.Number).ToList();
      }) ?? throw new InvalidOperationException("Failed to retrieve cached sustainable development goal options");
    }
    #endregion
  }
}
