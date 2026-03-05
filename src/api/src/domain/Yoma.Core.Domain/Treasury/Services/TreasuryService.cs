using FluentValidation;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Treasury.Extensions;
using Yoma.Core.Domain.Treasury.Interfaces;
using Yoma.Core.Domain.Treasury.Models;
using Yoma.Core.Domain.Treasury.Validators;

namespace Yoma.Core.Domain.Treasury.Services
{
  public sealed class TreasuryService : ITreasuryService
  {
    #region Class Variables
    private readonly TreasuryRequestUpdateValidator _treasuryRequestUpdateValidator;
    private readonly IRepository<Models.Treasury> _treasuryRepository;
    #endregion

    #region Constructor
    public TreasuryService(
      TreasuryRequestUpdateValidator treasuryRequestUpdateValidator,
      IRepository<Models.Treasury> treasuryRepository)
    {
      _treasuryRequestUpdateValidator = treasuryRequestUpdateValidator ?? throw new ArgumentNullException(nameof(treasuryRequestUpdateValidator));
      _treasuryRepository = treasuryRepository ?? throw new ArgumentNullException(nameof(treasuryRepository));
    }
    #endregion

    #region Public Members

    public Models.Treasury Get(LockMode? lockMode = null)
    {
      var query = lockMode != null ? _treasuryRepository.Query(lockMode.Value) : _treasuryRepository.Query();
      var entity = query.SingleOrDefault();
      return entity ?? throw new DataInconsistencyException($"Expected exactly one '{nameof(Models.Treasury)}' row but none was found.");
    }

    public TreasuryInfo Get()
    {
      return Get(null).ToInfo();
    }

    public List<TreasuryInfoOrganization> SearchOrganization(TreasuryInfoOrganizationSearchFilter filter)
    {
      throw new NotImplementedException();
    }

    public List<TreasuryInfoReferralProgram> SearchReferralProgram(TreasuryInfoReferralProgramSearchFilter filter)
    {
      throw new NotImplementedException();
    }

    public async Task<TreasuryInfo> Update(TreasuryRequestUpdate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _treasuryRequestUpdateValidator.ValidateAndThrowAsync(request);

      var result = Get(LockMode.Wait);

      if (request.ZltoRewardPool.HasValue && result.ZltoRewardCumulative.HasValue && request.ZltoRewardPool.Value < result.ZltoRewardCumulative.Value)
        throw new ValidationException($"The Zlto reward pool cannot be less than the cumulative Zlto rewards ({result.ZltoRewardCumulative.Value:F0}) already awarded across the system");

      if (request.ChimoneyPoolInUSD.HasValue && result.ChimoneyCumulativeInUSD.HasValue && request.ChimoneyPoolInUSD.Value < result.ChimoneyCumulativeInUSD.Value)
        throw new ValidationException($"The Chimoney pool cannot be less than the cumulative Chimoney payouts ({result.ChimoneyCumulativeInUSD.Value:F2}) already cashed out across the system");

      result.ZltoRewardPool = request.ZltoRewardPool;
      result.ChimoneyPoolInUSD = request.ChimoneyPoolInUSD;
      result.ConversionRateZltoUsd = request.ConversionRateZltoUsd;

      result = await _treasuryRepository.Update(result);

      return result.ToInfo();
    }

    public async Task ChimoneyCashedOut(Models.Treasury treasury, decimal amount)
    {
      ArgumentNullException.ThrowIfNull(treasury, nameof(treasury));

      if (amount < default(decimal))
        throw new ValidationException("Chimoney cash-out amount cannot be less than 0");

      if (amount == default) return; // 0 is valid but has no effect

      treasury.ChimoneyCumulativeInUSD = (treasury.ChimoneyCumulativeInUSD ?? default) + amount;

      await _treasuryRepository.Update(treasury);
    }

    public async Task ZltoRewardAwarded(Models.Treasury treasury, decimal? amount)
    {
      ArgumentNullException.ThrowIfNull(treasury, nameof(treasury));

      if (!amount.HasValue) return; // ZLTO reward optional

      if (amount.Value < default(decimal))
        throw new ValidationException("Zlto reward amount cannot be less than 0");

      if (amount.Value == default) return; // 0 valid but no effect

      treasury.ZltoRewardCumulative = (treasury.ZltoRewardCumulative ?? default) + amount.Value;

      await _treasuryRepository.Update(treasury);
    }
    #endregion
  }
}
