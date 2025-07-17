using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Lookups.Services
{
  public class EducationService : IEducationService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<Models.Education> _educationRepository;
    #endregion

    #region Constructor
    public EducationService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<Models.Education> educationRepository)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _educationRepository = educationRepository;
    }
    #endregion

    #region Public Members
    public Models.Education GetByName(string name)
    {
      var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(Models.Education)} with name '{name}' does not exists", nameof(name));
      return result;
    }

    public Models.Education? GetByNameOrNull(string name)
    {
      if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentNullException(nameof(name));
      name = name.Trim();

      return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.InvariantCultureIgnoreCase));
    }

    public Models.Education GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(Education)} with '{id}' does not exists", nameof(id));
      return result;
    }

    public Models.Education? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<Models.Education> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(CacheItemType.Lookups))
        return [.. _educationRepository.Query().OrderBy(o => o.Name == Education.Other.ToString() ? 1 : 0).ThenBy(o => o.Name)];

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<Models.Education>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return _educationRepository.Query().OrderBy(o => o.Name == Education.Other.ToString() ? 1 : 0).ThenBy(o => o.Name).ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(Models.Education)}s'");
      return result;
    }
    #endregion
  }
}
