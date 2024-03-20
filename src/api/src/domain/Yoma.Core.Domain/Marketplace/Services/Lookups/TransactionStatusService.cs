using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Marketplace.Interfaces.Lookups;

namespace Yoma.Core.Domain.Marketplace.Services.Lookups
{
  public class TransactionStatusService : ITransactionStatusService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<Models.Lookups.TransactionStatus> _transactionStatusRepository;
    #endregion

    #region Constructor
    public TransactionStatusService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<Models.Lookups.TransactionStatus> transactionStatusRepository)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _transactionStatusRepository = transactionStatusRepository;
    }
    #endregion

    #region Public Members
    public Models.Lookups.TransactionStatus GetByName(string name)
    {
      var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(Models.Lookups.TransactionStatus)} with name '{name}' does not exists", nameof(name));
      return result;
    }

    public Models.Lookups.TransactionStatus? GetByNameOrNull(string name)
    {
      if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentNullException(nameof(name));
      name = name.Trim();

      return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.InvariantCultureIgnoreCase));
    }

    public Models.Lookups.TransactionStatus GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(Models.Lookups.TransactionStatus)} with '{id}' does not exists", nameof(id));
      return result;
    }

    public Models.Lookups.TransactionStatus? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<Models.Lookups.TransactionStatus> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return _transactionStatusRepository.Query().OrderBy(o => o.Name).ToList();

      var result = _memoryCache.GetOrCreate(nameof(Models.Lookups.TransactionStatus), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return _transactionStatusRepository.Query().OrderBy(o => o.Name).ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(Models.Lookups.TransactionStatus)}s'");
      return result;
    }
    #endregion
  }
}
