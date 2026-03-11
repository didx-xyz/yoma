using FluentValidation;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Treasury.Extensions;
using Yoma.Core.Domain.Treasury.Helpers;
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

    public async Task<TreasuryInfo> Update(TreasuryRequestUpdate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _treasuryRequestUpdateValidator.ValidateAndThrowAsync(request);

      var result = Get(LockMode.Wait);

      if (request.ZltoRewardPoolCurrentFinancialYear.HasValue &&
          result.ZltoRewardCumulativeCurrentFinancialYear.HasValue &&
          request.ZltoRewardPoolCurrentFinancialYear.Value < result.ZltoRewardCumulativeCurrentFinancialYear.Value)
        throw new ValidationException($"The Zlto reward pool for the current financial year cannot be less than the cumulative Zlto rewards ({result.ZltoRewardCumulativeCurrentFinancialYear.Value:F0}) already awarded for the current financial year");

      if (request.ChimoneyPoolCurrentFinancialYearInUSD.HasValue &&
          result.ChimoneyCumulativeCurrentFinancialYearInUSD.HasValue &&
          request.ChimoneyPoolCurrentFinancialYearInUSD.Value < result.ChimoneyCumulativeCurrentFinancialYearInUSD.Value)
        throw new ValidationException($"The Chimoney pool for the current financial year cannot be less than the cumulative Chimoney payouts ({result.ChimoneyCumulativeCurrentFinancialYearInUSD.Value:F2}) already cashed out for the current financial year");

      var (financialYearStartDate, requiresRollover) = TreasuryHelper.EvaluateFinancialYear(request.FinancialYearStartMonth, request.FinancialYearStartDay, result.FinancialYearStartDate);

      result.FinancialYearStartMonth = request.FinancialYearStartMonth;
      result.FinancialYearStartDay = request.FinancialYearStartDay;
      result.FinancialYearStartDate = financialYearStartDate;

      if (requiresRollover)
      {
        result.ZltoRewardCumulativeCurrentFinancialYear = default;
        result.ChimoneyCumulativeCurrentFinancialYearInUSD = default;
      }

      result.ZltoRewardPoolCurrentFinancialYear = request.ZltoRewardPoolCurrentFinancialYear;
      result.ChimoneyPoolCurrentFinancialYearInUSD = request.ChimoneyPoolCurrentFinancialYearInUSD;
      result.ConversionRateZltoUsd = request.ConversionRateZltoUsd;

      result = await _treasuryRepository.Update(result);

      return result.ToInfo();
    }

    public async Task ChimoneyCashedOut(Models.Treasury treasury, decimal amount)
    {
      ArgumentNullException.ThrowIfNull(treasury, nameof(treasury));

      if (amount < default(decimal))
        throw new ValidationException("Amount cannot be less thanzero");

      if (amount == default) return; // 0 is valid but has no effect

      treasury.ChimoneyCumulativeInUSD = (treasury.ChimoneyCumulativeInUSD ?? default) + amount;
      treasury.ChimoneyCumulativeCurrentFinancialYearInUSD = (treasury.ChimoneyCumulativeCurrentFinancialYearInUSD ?? default) + amount;

      await _treasuryRepository.Update(treasury);
    }

    public async Task ZltoRewardAwarded(Models.Treasury treasury, decimal? amount)
    {
      ArgumentNullException.ThrowIfNull(treasury, nameof(treasury));

      if (!amount.HasValue) return; // ZLTO reward optional

      if (amount.Value < default(decimal))
        throw new ValidationException("Amount cannot be less than zero");

      if (amount.Value == default) return; // 0 valid but no effect

      if (amount % 1 != 0)
        throw new ValidationException("Amount must be a whole number");

      treasury.ZltoRewardCumulative = (treasury.ZltoRewardCumulative ?? default) + amount.Value;
      treasury.ZltoRewardCumulativeCurrentFinancialYear = (treasury.ZltoRewardCumulativeCurrentFinancialYear ?? default) + amount.Value;

      await _treasuryRepository.Update(treasury);
    }

    public async Task<decimal> ConvertZltoToUsd(decimal amount)
    {
      if (amount <= default(decimal))
        throw new ValidationException("Amount must be greater than zero");

      if (amount % 1 != 0)
        throw new ValidationException("Amount must be a whole number");

      var treasury = Get();

      return amount * treasury.ConversionRateZltoUsd;
    }
    #endregion
  }
}
