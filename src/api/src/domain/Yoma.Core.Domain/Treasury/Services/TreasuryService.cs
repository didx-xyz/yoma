using FluentValidation;
using Microsoft.AspNetCore.Http;
using System.Transactions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Payout.Interfaces;
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
    private readonly IPayoutTransactionService _payoutTransactionService;
    private readonly IUserService _userService;
    private readonly IExecutionStrategyService _executionStrategyService;
    #endregion

    #region Constructor
    public TreasuryService(
      TreasuryRequestUpdateValidator treasuryRequestUpdateValidator,
      IHttpContextAccessor httpContextAccessor,
      IRepository<Models.Treasury> treasuryRepository,
      IOrganizationService organizationService,
      IPayoutTransactionService payoutTransactionService,
      IUserService userService,
      IExecutionStrategyService executionStrategyService)
    {
      _treasuryRequestUpdateValidator = treasuryRequestUpdateValidator ?? throw new ArgumentNullException(nameof(treasuryRequestUpdateValidator));
      _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
      _treasuryRepository = treasuryRepository ?? throw new ArgumentNullException(nameof(treasuryRepository));
      _organizationService = organizationService ?? throw new ArgumentNullException(nameof(organizationService));
      _payoutTransactionService = payoutTransactionService ?? throw new ArgumentNullException(nameof(payoutTransactionService));
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

    public TreasuryInfo GetInfo()
    {
      var treasury = Get();
      var payoutTotalPending = _payoutTransactionService.GetTotalPending();
      return treasury.ToInfo(payoutTotalPending);
    }

    public async Task<TreasuryInfo> Update(TreasuryRequestUpdate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _treasuryRequestUpdateValidator.ValidateAndThrowAsync(request);

      Models.Treasury? result = null;
      var payoutTotalPending = 0m;
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

        // Ensure the requested current financial year pool covers the current financial year cumulative and all pending
        // payouts. Pending payouts are not limited to the current financial year and remain funded through a rollover.
        payoutTotalPending = _payoutTransactionService.GetTotalPending();
        var payoutCumulativeCurrentFinancialYearInUsd = requiresRollover ? 0m : result.PayoutCumulativeCurrentFinancialYearInUsd ?? 0m;
        var payoutTotalCommitted = payoutCumulativeCurrentFinancialYearInUsd + payoutTotalPending;
        if (request.PayoutPoolCurrentFinancialYearInUsd.HasValue &&
            request.PayoutPoolCurrentFinancialYearInUsd.Value < payoutTotalCommitted)
          throw new ValidationException($"The payout pool for the current financial year cannot be less than the total payout amount ({payoutTotalCommitted:F2} USD) already paid out or pending");

        result.FinancialYearStartMonth = request.FinancialYearStartMonth;
        result.FinancialYearStartDay = request.FinancialYearStartDay;
        result.FinancialYearStartDate = financialYearStartDate;

        if (requiresRollover)
          await ResetCurrentFinancialYear(result, false);

        result.ZltoRewardPoolCurrentFinancialYear = request.ZltoRewardPoolCurrentFinancialYear;
        result.PayoutPoolCurrentFinancialYearInUsd = request.PayoutPoolCurrentFinancialYearInUsd;
        result.ConversionRateZltoUsd = Math.Round(Constants.ConversionRateUsdAmount / request.ConversionRateZltoPerUsd, 10);

        result.ModifiedByUserId = ResolveModifiedByUserId();
        result = await _treasuryRepository.Update(result);

        scope.Complete();
      });

      return (result ?? throw new DataInconsistencyException("Treasury update did not return a result.")).ToInfo(payoutTotalPending);
    }

    public async Task PayoutCompleted(Models.Treasury treasury, decimal amount)
    {
      ArgumentNullException.ThrowIfNull(treasury, nameof(treasury));

      if (amount < 0m)
        throw new ValidationException("Amount cannot be less than zero");

      if (amount == 0m) return;

      // Add the confirmed paid-out amount to the lifetime and current financial year cumulatives. Pool availability was
      // checked when the payout was created and is not checked again. A payout created in a previous financial year is
      // allocated to the current financial year when completed.
      await EnsureCurrentFinancialYear(treasury);

      treasury.PayoutCumulativeInUsd = (treasury.PayoutCumulativeInUsd ?? 0m) + amount;
      treasury.PayoutCumulativeCurrentFinancialYearInUsd = (treasury.PayoutCumulativeCurrentFinancialYearInUsd ?? 0m) + amount;

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

      // Add the scheduled reward to the lifetime and current financial year cumulatives. Yoma controls reward processing
      // and retries, so pending or error wallet awards remain allocated and pool availability is not checked again.
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

    public async Task<ConversionResponse> ConvertZltoToUsd(decimal amount)
    {
      if (amount <= 0m)
        throw new ValidationException("Amount must be greater than zero");

      if (amount % 1 != 0)
        throw new ValidationException("Amount must be a whole number");

      ConversionResponse? result = null;
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

        var treasury = Get(LockMode.Wait);
        await EnsureCurrentFinancialYear(treasury);

        var amountConverted = Math.Round(amount * treasury.ConversionRateZltoUsd, 2, MidpointRounding.AwayFromZero);
        var payoutTotalPending = _payoutTransactionService.GetTotalPending();
        var payoutBalanceAvailable = treasury.CalculatePayoutBalanceAvailableCurrentFinancialYearInUsd(payoutTotalPending);

        result = new ConversionResponse
        {
          Amount = amountConverted,
          TreasuryFundsAvailable = !payoutBalanceAvailable.HasValue || amountConverted <= payoutBalanceAvailable.Value
        };

        scope.Complete();
      });

      return result ?? throw new DataInconsistencyException("Treasury conversion did not return a result");
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
      // Reset the current financial year cumulatives. Pending or error rewards remain allocated to the financial year in
      // which they were scheduled and continue processing. Pending payouts remain in the transaction ledger and reduce
      // the payout balance available in the current financial year after rollover.
      treasury.ZltoRewardCumulativeCurrentFinancialYear = 0m;
      treasury.PayoutCumulativeCurrentFinancialYearInUsd = 0m;

      await _organizationService.ResetRewardCumulativesCurrentFinancialYear(actionedBySystem);
    }
    #endregion
  }
}
