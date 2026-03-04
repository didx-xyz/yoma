using FluentValidation;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Treasury.Extensions;
using Yoma.Core.Domain.Treasury.Interfaces;
using Yoma.Core.Domain.Treasury.Models;
using Yoma.Core.Domain.Treasury.Validators;

namespace Yoma.Core.Domain.Treasury.Services
{
  public sealed class TreasuryService : ITreasuryService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly TreasuryRequestUpdateValidator _treasuryRequestUpdateValidator;

    private readonly IRepository<Models.Treasury> _treasuryRepository;
    #endregion

    #region Constructor
    public TreasuryService(IOptions<AppSettings> appSettings,
      IMemoryCache memoryCache,
      TreasuryRequestUpdateValidator treasuryRequestUpdateValidator,
      IRepository<Models.Treasury> treasuryRepository)
    {
      _appSettings = appSettings.Value ?? throw new ArgumentNullException(nameof(appSettings));
      _memoryCache = memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));
      _treasuryRequestUpdateValidator = treasuryRequestUpdateValidator ?? throw new ArgumentNullException(nameof(treasuryRequestUpdateValidator));
      _treasuryRepository = treasuryRepository ?? throw new ArgumentNullException(nameof(treasuryRepository));
    }
    #endregion

    #region Public Members
    public TreasuryInfo Get()
    {
      return GetInternal().ToInfo();
    }

    public async Task<TreasuryInfo> Update(TreasuryRequestUpdate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _treasuryRequestUpdateValidator.ValidateAndThrowAsync(request);

      var result = GetInternal();

      if (request.ZltoRewardPool.HasValue && result.ZltoRewardCumulative.HasValue && request.ZltoRewardPool.Value < result.ZltoRewardCumulative.Value)
        throw new ValidationException($"The Zlto reward pool cannot be less than the cumulative Zlto rewards ({result.ZltoRewardCumulative.Value:F0}) already awarded across the system");

      if (request.ChimoneyPoolInUSD.HasValue && result.ChimoneyCumulativeInUSD.HasValue && request.ChimoneyPoolInUSD.Value < result.ChimoneyCumulativeInUSD.Value)
        throw new ValidationException($"The Chimoney pool cannot be less than the cumulative Chimoney payouts ({result.ChimoneyCumulativeInUSD.Value:F2}) already cashed out across the system");

      result.ZltoRewardPool = request.ZltoRewardPool;
      result.ChimoneyPoolInUSD = request.ChimoneyPoolInUSD;
      result.ConversionRateZltoUsd = request.ConversionRateZltoUsd;

      result = await _treasuryRepository.Update(result);

      _memoryCache.Remove(CacheHelper.GenerateKey<Models.Treasury>());

      return result.ToInfo();
    }

    public Task ChimoneyCashedOut(decimal amount)
    {
      throw new NotImplementedException();
    }

    public Task ZltoRewardAwarded(decimal amount)
    {
      throw new NotImplementedException();
    }
    #endregion

    #region Private Members
    public Models.Treasury GetInternal()
    {
      Models.Treasury QuerySingleOrThrow()
      {
        var entity = _treasuryRepository.Query().SingleOrDefault();
        return entity ?? throw new DataInconsistencyException($"Expected exactly one '{nameof(Models.Treasury)}' row but none was found.");
      }

      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(CacheItemType.Lookups))
        return QuerySingleOrThrow();

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<Models.Treasury>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return QuerySingleOrThrow();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached item of '{nameof(Models.Treasury)}'.");

      return result;
    }
    #endregion
  }
}
