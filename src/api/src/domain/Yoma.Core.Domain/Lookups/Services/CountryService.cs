using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Lookups.Services
{
  public class CountryService : ICountryService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<Models.Country> _countryRepository;
    #endregion

    #region Constructor
    public CountryService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<Models.Country> countryRepository)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _countryRepository = countryRepository;
    }
    #endregion

    #region Public Members
    public Models.Country GetByName(string name)
    {
      var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(Country)} with name '{name}' does not exists", nameof(name));
      return result;
    }

    public Models.Country? GetByNameOrNull(string name)
    {
      if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentNullException(nameof(name));
      name = name.Trim();

      return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.InvariantCultureIgnoreCase));
    }

    public Models.Country GetByCodeAplha2(string code)
    {
      var result = GetByCodeAplha2OrNull(code) ?? throw new ArgumentException($"{nameof(Country)} with code '{code}' does not exists", nameof(code));
      return result;
    }

    public Models.Country? GetByCodeAplha2OrNull(string code)
    {
      if (string.IsNullOrWhiteSpace(code))
        throw new ArgumentNullException(nameof(code));
      code = code.Trim();

      return List().SingleOrDefault(o => string.Equals(o.CodeAlpha2, code, StringComparison.InvariantCultureIgnoreCase));
    }

    public Models.Country GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(Country)} with '{id}' does not exists", nameof(id));
      return result;
    }

    public Models.Country? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<Models.Country> List(bool? excludeWorldwide = null)
    {
      var query = _countryRepository.Query();

      if (excludeWorldwide is true)
        query = query.Where(o => o.CodeAlpha2 != Country.Worldwide.ToDescription());

      query = query.OrderBy(o => o.CodeAlpha2 != Country.Worldwide.ToDescription()).ThenBy(o => o.Name); //ensure Worldwide appears first

      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(CacheItemType.Lookups))
        return [.. query];

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<Models.Country>(excludeWorldwide is true), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return query.ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of 'Countries'");
      return result;
    }
    #endregion
  }
}
