using FluentValidation;
using Microsoft.AspNetCore.Http;
using System.Transactions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
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
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IRepository<Models.Treasury> _treasuryRepository;
    private readonly IOrganizationService _organizationService;
    private readonly IUserService _userService;
    private readonly IExecutionStrategyService _executionStrategyService;
    #endregion

    #region Constructor
    public TreasuryService(
      TreasuryRequestUpdateValidator treasuryRequestUpdateValidator,
      IHttpContextAccessor httpContextAccessor,
      IRepository<Models.Treasury> treasuryRepository,
      IOrganizationService organizationService,
      IUserService userService,
      IExecutionStrategyService executionStrategyService)
    {
      _treasuryRequestUpdateValidator = treasuryRequestUpdateValidator ?? throw new ArgumentNullException(nameof(treasuryRequestUpdateValidator));
      _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
      _treasuryRepository = treasuryRepository ?? throw new ArgumentNullException(nameof(treasuryRepository));
      _organizationService = organizationService ?? throw new ArgumentNullException(nameof(organizationService));
      _userService = userService ?? throw new ArgumentNullException(nameof(userService));
      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));
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

      Models.Treasury? result = null;
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

        result = Get(LockMode.Wait);

        var (financialYearStartDate, requiresRollover) = TreasuryHelper.EvaluateFinancialYear(
          request.FinancialYearStartMonth,
          request.FinancialYearStartDay,
          result.FinancialYearStartDate);

        var zltoRewardCumulativeCurrentFinancialYear = requiresRollover ? 0m : result.ZltoRewardCumulativeCurrentFinancialYear ?? 0m;
        if (request.ZltoRewardPoolCurrentFinancialYear.HasValue &&
            request.ZltoRewardPoolCurrentFinancialYear.Value < zltoRewardCumulativeCurrentFinancialYear)
          throw new ValidationException($"The ZLTO reward pool for the current financial year cannot be less than the cumulative ZLTO rewards ({zltoRewardCumulativeCurrentFinancialYear:F0}) already awarded for the current financial year");

        var cashOutCumulativeCurrentFinancialYearInUsd = requiresRollover ? 0m : result.CashOutCumulativeCurrentFinancialYearInUsd ?? 0m;
        if (request.CashOutPoolCurrentFinancialYearInUsd.HasValue &&
            request.CashOutPoolCurrentFinancialYearInUsd.Value < cashOutCumulativeCurrentFinancialYearInUsd)
          throw new ValidationException($"The cash-out pool for the current financial year cannot be less than the cumulative cash-out amount ({cashOutCumulativeCurrentFinancialYearInUsd:F2} USD) already completed for the current financial year");

        result.FinancialYearStartMonth = request.FinancialYearStartMonth;
        result.FinancialYearStartDay = request.FinancialYearStartDay;
        result.FinancialYearStartDate = financialYearStartDate;

        if (requiresRollover)
          await ResetCurrentFinancialYear(result, false);

        result.ZltoRewardPoolCurrentFinancialYear = request.ZltoRewardPoolCurrentFinancialYear;
        result.CashOutPoolCurrentFinancialYearInUsd = request.CashOutPoolCurrentFinancialYearInUsd;
        result.ConversionRateZltoUsd = Math.Round(Constants.ConversionRateUsdAmount / request.ConversionRateZltoPerUsd, 10);

        result.ModifiedByUserId = ResolveModifiedByUserId();
        result = await _treasuryRepository.Update(result);

        scope.Complete();
      });

      return (result ?? throw new DataInconsistencyException("Treasury update did not return a result.")).ToInfo();
    }

    public async Task CashOutCompleted(Models.Treasury treasury, decimal amount)
    {
      ArgumentNullException.ThrowIfNull(treasury, nameof(treasury));

      if (amount < 0m)
        throw new ValidationException("Amount cannot be less than zero");

      if (amount == 0m) return;

      await EnsureCurrentFinancialYear(treasury);

      treasury.CashOutCumulativeInUsd = (treasury.CashOutCumulativeInUsd ?? 0m) + amount;
      treasury.CashOutCumulativeCurrentFinancialYearInUsd = (treasury.CashOutCumulativeCurrentFinancialYearInUsd ?? 0m) + amount;

      await _treasuryRepository.Update(treasury);
    }

    public async Task ZltoRewardAwarded(Models.Treasury treasury, decimal? amount)
    {
      ArgumentNullException.ThrowIfNull(treasury, nameof(treasury));

      if (!amount.HasValue) return;

      if (amount.Value < 0m)
        throw new ValidationException("Amount cannot be less than zero");

      if (amount.Value == 0m) return;

      if (amount % 1 != 0)
        throw new ValidationException("Amount must be a whole number");

      await EnsureCurrentFinancialYear(treasury);

      treasury.ZltoRewardCumulative = (treasury.ZltoRewardCumulative ?? 0m) + amount.Value;
      treasury.ZltoRewardCumulativeCurrentFinancialYear = (treasury.ZltoRewardCumulativeCurrentFinancialYear ?? 0m) + amount.Value;

      await _treasuryRepository.Update(treasury);
    }

    public async Task<bool> EnsureCurrentFinancialYear(Models.Treasury treasury)
    {
      ArgumentNullException.ThrowIfNull(treasury, nameof(treasury));

      var (financialYearStartDate, requiresRollover) = TreasuryHelper.EvaluateFinancialYear(
        treasury.FinancialYearStartMonth,
        treasury.FinancialYearStartDay,
        treasury.FinancialYearStartDate);

      if (!requiresRollover) return false;

      treasury.FinancialYearStartDate = financialYearStartDate;
      await ResetCurrentFinancialYear(treasury, true);
      await _treasuryRepository.Update(treasury);

      return true;
    }

    public async Task<bool> ProcessFinancialYearRollover()
    {
      var rolloverProcessed = false;

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

        var treasury = Get(LockMode.Wait);
        rolloverProcessed = await EnsureCurrentFinancialYear(treasury);

        scope.Complete();
      });

      return rolloverProcessed;
    }

    public async Task<decimal> ConvertZltoToUsd(decimal amount)
    {
      if (amount <= 0m)
        throw new ValidationException("Amount must be greater than zero");

      if (amount % 1 != 0)
        throw new ValidationException("Amount must be a whole number");

      var treasury = Get();

      return Math.Round(amount * treasury.ConversionRateZltoUsd, 2, MidpointRounding.AwayFromZero);
    }
    #endregion

    #region Private Members
    private Guid ResolveModifiedByUserId()
    {
      var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false);
      return _userService.GetByUsername(username, false, false).Id;
    }

    private async Task ResetCurrentFinancialYear(Models.Treasury treasury, bool actionedBySystem)
    {
      treasury.ZltoRewardCumulativeCurrentFinancialYear = 0m;
      treasury.CashOutCumulativeCurrentFinancialYearInUsd = 0m;

      await _organizationService.ResetRewardCumulativesCurrentFinancialYear(actionedBySystem);
    }
    #endregion
  }
}
