using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Lookups.Services
{
  public class LanguageService : ILanguageService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<Language> _languageRepository;
    #endregion

    #region Constructor
    public LanguageService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<Language> languageRepository)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _languageRepository = languageRepository;
    }
    #endregion

    #region Public Members
    public Language GetByName(string name)
    {
      var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(Language)} with name '{name}' does not exists", nameof(name));
      return result;
    }

    public Language? GetByNameOrNull(string name)
    {
      if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentNullException(nameof(name));
      name = name.Trim();

      return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.InvariantCultureIgnoreCase));
    }

    public Language GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(Language)} with '{id}' does not exists", nameof(id));
      return result;
    }

    public Language GetByCodeAplha2(string code)
    {
      var result = GetByCodeAplha2OrNull(code) ?? throw new ArgumentException($"{nameof(Language)} with code '{code}' does not exists", nameof(code));
      return result;
    }

    public Language? GetByCodeAplha2OrNull(string code)
    {
      if (string.IsNullOrWhiteSpace(code))
        throw new ArgumentNullException(nameof(code));
      code = code.Trim();

      return List().SingleOrDefault(o => string.Equals(o.CodeAlpha2, code, StringComparison.InvariantCultureIgnoreCase));
    }

    public Language? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<Language> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return _languageRepository.Query().OrderBy(o => o.Name).ToList();

      var result = _memoryCache.GetOrCreate(nameof(Language), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return _languageRepository.Query().OrderBy(o => o.Name).ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(Language)}s'");
      return result;
    }
    #endregion
  }
}
