using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Payout.Interfaces.Lookups;

namespace Yoma.Core.Domain.Payout.Services.Lookups
{
  public sealed class PayoutTransactionStatusService : IPayoutTransactionStatusService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<Models.Lookups.PayoutTransactionStatus> _payoutTransactionStatusRepository;
    #endregion

    #region Constructor
    public PayoutTransactionStatusService(
      IOptions<AppSettings> appSettings,
      IMemoryCache memoryCache,
      IRepository<Models.Lookups.PayoutTransactionStatus> payoutTransactionStatusRepository)
    {
      _appSettings = (appSettings ?? throw new ArgumentNullException(nameof(appSettings))).Value;
      _memoryCache = memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));
      _payoutTransactionStatusRepository = payoutTransactionStatusRepository ?? throw new ArgumentNullException(nameof(payoutTransactionStatusRepository));
    }
    #endregion

    #region Public Members
    public Models.Lookups.PayoutTransactionStatus GetByName(string name)
    {
      var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(Models.Lookups.PayoutTransactionStatus)} with name '{name}' does not exists", nameof(name));
      return result;
    }

    public Models.Lookups.PayoutTransactionStatus? GetByNameOrNull(string name)
    {
      var nameNormalized = name?.Trim();
      if (string.IsNullOrEmpty(nameNormalized))
        throw new ArgumentNullException(nameof(name));

      return List().SingleOrDefault(o => string.Equals(o.Name, nameNormalized, StringComparison.OrdinalIgnoreCase));
    }

    public Models.Lookups.PayoutTransactionStatus GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(Models.Lookups.PayoutTransactionStatus)} with '{id}' does not exists", nameof(id));
      return result;
    }

    public Models.Lookups.PayoutTransactionStatus? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<Models.Lookups.PayoutTransactionStatus> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return [.. _payoutTransactionStatusRepository.Query().OrderBy(o => o.Name)];

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<Models.Lookups.PayoutTransactionStatus>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return _payoutTransactionStatusRepository.Query().OrderBy(o => o.Name).ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(Models.Lookups.PayoutTransactionStatus)}s'");
      return result;
    }
    #endregion
  }
}
