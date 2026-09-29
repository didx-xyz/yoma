using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Lookups.Services
{
  public class CurrencyService : ICurrencyService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<Currency> _repository;
    #endregion

    #region Constructor
    public CurrencyService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<Currency> repository)
    {
      _appSettings = appSettings?.Value ?? throw new ArgumentNullException(nameof(appSettings));
      _memoryCache = memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));
      _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }
    #endregion

    #region Public Members
    public Currency GetByCode(string code)
    {
      return GetByCodeOrNull(code) ?? throw new ArgumentException($"{nameof(Currency)} with code '{code}' does not exist", nameof(code));
    }

    public Currency? GetByCodeOrNull(string code)
    {
      if (string.IsNullOrWhiteSpace(code)) throw new ArgumentNullException(nameof(code));

      code = code.Trim();

      return List().SingleOrDefault(o => string.Equals(o.Code, code, StringComparison.OrdinalIgnoreCase));
    }

    public Currency GetById(Guid id)
    {
      return GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(Currency)} with id '{id}' does not exist", nameof(id));
    }

    public Currency? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty) throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<Currency> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return [.. _repository.Query().OrderBy(o => o.Code)];

      return _memoryCache.GetOrCreate(CacheHelper.GenerateKey<Currency>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);

        return _repository.Query().OrderBy(o => o.Code).ToList();
      }) ?? throw new InvalidOperationException("Failed to retrieve cached currency options");
    }
    #endregion
  }
}
