using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;

namespace Yoma.Core.Domain.Entity.Services.Lookups
{
  public class UserGoalService : IUserGoalService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<Models.Lookups.UserGoal> _userGoalRepository;
    #endregion

    #region Constructor
    public UserGoalService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<Models.Lookups.UserGoal> userGoalRepository)
    {
      _appSettings = appSettings?.Value ?? throw new ArgumentNullException(nameof(appSettings));
      _memoryCache = memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));
      _userGoalRepository = userGoalRepository ?? throw new ArgumentNullException(nameof(userGoalRepository));
    }
    #endregion

    #region Public Members
    public Models.Lookups.UserGoal GetByName(string name)
    {
      return GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(Models.Lookups.UserGoal)} with name '{name}' does not exist", nameof(name));
    }

    public Models.Lookups.UserGoal? GetByNameOrNull(string name)
    {
      if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentNullException(nameof(name));
      name = name.Trim();

      return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.OrdinalIgnoreCase));
    }

    public Models.Lookups.UserGoal GetById(Guid id)
    {
      return GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(Models.Lookups.UserGoal)} with id '{id}' does not exist", nameof(id));
    }

    public Models.Lookups.UserGoal? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<Models.Lookups.UserGoal> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return [.. _userGoalRepository.Query().OrderBy(o => o.Name)];

      return _memoryCache.GetOrCreate(CacheHelper.GenerateKey<Models.Lookups.UserGoal>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return _userGoalRepository.Query().OrderBy(o => o.Name).ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(Models.Lookups.UserGoal)}s'");
    }
    #endregion
  }
}
