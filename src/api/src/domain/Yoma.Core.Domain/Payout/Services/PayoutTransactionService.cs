using FluentValidation;
using System.Transactions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Extensions;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Payout.Interfaces;
using Yoma.Core.Domain.Payout.Interfaces.Lookups;
using Yoma.Core.Domain.Payout.Models;
using Yoma.Core.Domain.Payout.Validators;
using Yoma.Core.Domain.Reward.Interfaces;

namespace Yoma.Core.Domain.Payout.Services
{
  public sealed class PayoutTransactionService : IPayoutTransactionService
  {
    #region Class Variables
    private readonly IPayoutTransactionStatusService _payoutTransactionStatusService;
    private readonly IRepository<PayoutTransaction> _payoutTransactionRepository;
    private readonly IUserService _userService;
    private readonly IRewardService _rewardService;
    private readonly IExecutionStrategyService _executionStrategyService;
    private readonly PayoutTransactionSearchFilterValidator _payoutTransactionSearchFilterValidator;

    private static readonly PayoutTransactionStatus[] Statuses_CanProcess = [PayoutTransactionStatus.Initiated, PayoutTransactionStatus.ReconciliationRequired];
    private static readonly PayoutTransactionStatus[] Statuses_CanReconcile = [PayoutTransactionStatus.Initiated, PayoutTransactionStatus.Processing];
    private static readonly PayoutTransactionStatus[] Statuses_CanComplete = [PayoutTransactionStatus.Processing, PayoutTransactionStatus.ReconciliationRequired];
    private static readonly PayoutTransactionStatus[] Statuses_CanFail = [PayoutTransactionStatus.Initiated, PayoutTransactionStatus.Processing, PayoutTransactionStatus.ReconciliationRequired];
    private static readonly PayoutTransactionStatus[] Statuses_CanCancel = [PayoutTransactionStatus.Processing, PayoutTransactionStatus.ReconciliationRequired];
    private static readonly PayoutTransactionStatus[] Statuses_CanExpire = [PayoutTransactionStatus.Processing, PayoutTransactionStatus.ReconciliationRequired];
    private static readonly PayoutTransactionStatus[] Statuses_Active =
      [PayoutTransactionStatus.Initiated, PayoutTransactionStatus.Processing, PayoutTransactionStatus.ReconciliationRequired];
    #endregion

    #region Constructor
    public PayoutTransactionService(
      IPayoutTransactionStatusService payoutTransactionStatusService,
      IRepository<PayoutTransaction> payoutTransactionRepository,
      IUserService userService,
      IRewardService rewardService,
      IExecutionStrategyService executionStrategyService,
      PayoutTransactionSearchFilterValidator payoutTransactionSearchFilterValidator)
    {
      _payoutTransactionStatusService = payoutTransactionStatusService ?? throw new ArgumentNullException(nameof(payoutTransactionStatusService));
      _payoutTransactionRepository = payoutTransactionRepository ?? throw new ArgumentNullException(nameof(payoutTransactionRepository));
      _userService = userService ?? throw new ArgumentNullException(nameof(userService));
      _rewardService = rewardService ?? throw new ArgumentNullException(nameof(rewardService));
      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));
      _payoutTransactionSearchFilterValidator = payoutTransactionSearchFilterValidator ?? throw new ArgumentNullException(nameof(payoutTransactionSearchFilterValidator));
    }
    #endregion

    #region Public Members
    public PayoutTransaction GetById(Guid id)
    {
      return GetById(id, null);
    }

    public PayoutTransactionInfo GetInfoById(Guid id)
    {
      var transaction = GetById(id);
      var user = _userService.GetById(transaction.UserId, false, false);

      return new PayoutTransactionInfo
      {
        Transaction = transaction,
        User = user.ToInfo(),
        RewardTransaction = _rewardService.GetByEntity(
          transaction.UserId,
          Reward.RewardTransactionEntityType.Payout,
          transaction.Id)
      };
    }

    public PayoutTransaction? GetActiveByUserIdOrNull(Guid userId)
    {
      if (userId == Guid.Empty)
        throw new ArgumentNullException(nameof(userId));

      var statusIds = Statuses_Active.Select(o => _payoutTransactionStatusService.GetByName(o.ToString()).Id).ToList();
      return _payoutTransactionRepository.Query().SingleOrDefault(o => o.UserId == userId && statusIds.Contains(o.StatusId));
    }

    // Pending includes every non-terminal payout status.
    public decimal GetTotalPending()
    {
      var statusIds = Statuses_Active.Select(o => _payoutTransactionStatusService.GetByName(o.ToString()).Id).ToList();
      return _payoutTransactionRepository.Query()
        .Where(o => statusIds.Contains(o.StatusId) && o.Currency == Currency.USD.ToString())
        .Sum(o => o.Amount);
    }

    public List<PayoutTransaction> ListByUserId(Guid userId)
    {
      if (userId == Guid.Empty)
        throw new ArgumentNullException(nameof(userId));

      return [.. _payoutTransactionRepository.Query()
        .Where(o => o.UserId == userId)
        .OrderByDescending(o => o.DateCreated)
        .ThenByDescending(o => o.Id)];
    }

    public PayoutTransactionSearchResults Search(PayoutTransactionSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _payoutTransactionSearchFilterValidator.ValidateAndThrow(filter);

      var query = _payoutTransactionRepository.Query();

      if (filter.Id.HasValue)
        query = query.Where(o => o.Id == filter.Id.Value);

      if (filter.UserId.HasValue)
        query = query.Where(o => o.UserId == filter.UserId.Value);

      if (filter.Types != null && filter.Types.Count != 0)
      {
        var types = filter.Types.Distinct().Select(o => o.ToString()).ToList();
        query = query.Where(o => types.Contains(o.Type));
      }

      if (filter.Providers != null && filter.Providers.Count != 0)
      {
        var providers = filter.Providers.Distinct().Select(o => o.ToString()).ToList();
        query = query.Where(o => providers.Contains(o.Provider));
      }

      if (filter.Statuses != null && filter.Statuses.Count != 0)
      {
        var statusIds = filter.Statuses.Distinct().Select(o => _payoutTransactionStatusService.GetByName(o.ToString()).Id).ToList();
        query = query.Where(o => statusIds.Contains(o.StatusId));
      }

      if (filter.AmountFrom.HasValue)
        query = query.Where(o => o.Amount >= filter.AmountFrom.Value);

      if (filter.AmountTo.HasValue)
        query = query.Where(o => o.Amount <= filter.AmountTo.Value);

      if (filter.DateStart.HasValue)
      {
        filter.DateStart = filter.DateStart.Value.RemoveTime();
        query = query.Where(o => o.DateCreated >= filter.DateStart.Value);
      }

      if (filter.DateEnd.HasValue)
      {
        filter.DateEnd = filter.DateEnd.Value.ToEndOfDay();
        query = query.Where(o => o.DateCreated <= filter.DateEnd.Value);
      }

      if (!string.IsNullOrWhiteSpace(filter.ValueContains))
      {
        filter.ValueContains = filter.ValueContains.Trim();
        var valueContains = filter.ValueContains.ToLower();
        var id = Guid.TryParse(filter.ValueContains, out var idParsed) ? idParsed : (Guid?)null;

#pragma warning disable CA1862 // Query provider does not translate StringComparison overloads
        query = query.Where(o =>
          (id.HasValue && (o.Id == id.Value || o.UserId == id.Value)) ||
          (o.Username != null && o.Username.ToLower().Contains(valueContains)) ||
          (o.UserEmail != null && o.UserEmail.ToLower().Contains(valueContains)) ||
          (o.UserPhoneNumber != null && o.UserPhoneNumber.ToLower().Contains(valueContains)) ||
          (o.UserDisplayName != null && o.UserDisplayName.ToLower().Contains(valueContains)) ||
          (o.TransactionId != null && o.TransactionId.ToLower().Contains(valueContains)) ||
          (o.ErrorReason != null && o.ErrorReason.ToLower().Contains(valueContains)));
#pragma warning restore CA1862 // Query provider does not translate StringComparison overloads
      }

      var results = new PayoutTransactionSearchResults();

      query = query.OrderByDescending(o => o.DateCreated).ThenByDescending(o => o.Id);

      if (filter.PaginationEnabled)
      {
        results.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      results.Items = [.. query];

      return results;
    }

    public async Task<PayoutTransaction> Create(Guid userId, PayoutType type, Provider provider, decimal amount, DateTimeOffset? rewardReservationExpiresAt = null)
    {
      if (userId == Guid.Empty)
        throw new ArgumentNullException(nameof(userId));

      if (!Enum.IsDefined(type))
        throw new ArgumentOutOfRangeException(nameof(type));

      if (!Enum.IsDefined(provider))
        throw new ArgumentOutOfRangeException(nameof(provider));

      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(amount, default, nameof(amount));
      if (decimal.Round(amount, 2) != amount)
        throw new ArgumentOutOfRangeException(nameof(amount), "Amount may not have more than 2 decimal places for USD");

      var status = _payoutTransactionStatusService.GetByName(PayoutTransactionStatus.Initiated.ToString());
      var result = new PayoutTransaction
      {
        UserId = userId,
        Type = type.ToString(),
        Provider = provider.ToString(),
        StatusId = status.Id,
        Status = PayoutTransactionStatus.Initiated,
        Amount = amount,
        Currency = Currency.USD.ToString(),
        RewardReservationExpiresAt = rewardReservationExpiresAt
      };

      return await _payoutTransactionRepository.Create(result);
    }

    public async Task<PayoutTransaction> UpdateTransaction(PayoutTransaction item)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      item.TransactionId = item.TransactionId?.Trim();
      item.ErrorReason = item.ErrorReason?.Trim();

      if (!Enum.IsDefined(item.Status))
        throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(PayoutTransactionStatus)} of '{item.Status}' not supported");

      if (item.Status == PayoutTransactionStatus.Processing && string.IsNullOrEmpty(item.TransactionId))
        throw new ArgumentNullException(nameof(item), "Transaction id required when processing");

      if (item.Status == PayoutTransactionStatus.Failed && string.IsNullOrEmpty(item.ErrorReason))
        throw new ArgumentNullException(nameof(item), "Error reason required when failed");

      PayoutTransaction? result = null;
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

        result = GetById(item.Id, LockMode.Wait);

        if (result.Status == item.Status)
        {
          if (item.Status == PayoutTransactionStatus.Processing &&
              !string.Equals(result.TransactionId, item.TransactionId, StringComparison.Ordinal))
            throw new DataInconsistencyException($"Transaction id mismatch detected for payout transaction with id '{result.Id}'");

          if (item.Status is PayoutTransactionStatus.Processing or PayoutTransactionStatus.ReconciliationRequired)
          {
            ApplyProviderDetails(result, item);
            result.DateLastReconciled = item.DateLastReconciled;
            result.RetryCount = item.RetryCount;
            result.ErrorReason = item.ErrorReason;
            result = await _payoutTransactionRepository.Update(result);
          }

          scope.Complete();
          return;
        }

        switch (item.Status)
        {
          case PayoutTransactionStatus.Processing:
            if (!Statuses_CanProcess.Contains(result.Status))
              throw new ValidationException($"{nameof(PayoutTransaction)} can not be processed (current status '{result.Status}'). Required state '{Statuses_CanProcess.JoinNames()}'");

            ApplyProviderDetails(result, item);
            result.DateLastReconciled = item.DateLastReconciled;
            result.RetryCount = null;
            result.ErrorReason = null;
            break;

          case PayoutTransactionStatus.ReconciliationRequired:
            if (!Statuses_CanReconcile.Contains(result.Status))
              throw new ValidationException($"{nameof(PayoutTransaction)} can not require reconciliation (current status '{result.Status}'). Required state '{Statuses_CanReconcile.JoinNames()}'");

            ApplyProviderDetails(result, item);
            result.DateLastReconciled = item.DateLastReconciled ?? DateTimeOffset.UtcNow;
            result.RetryCount = item.RetryCount;
            result.ErrorReason = item.ErrorReason;
            break;

          case PayoutTransactionStatus.Completed:
            if (!Statuses_CanComplete.Contains(result.Status))
              throw new ValidationException($"{nameof(PayoutTransaction)} can not be completed (current status '{result.Status}'). Required state '{Statuses_CanComplete.JoinNames()}'");

            ApplyProviderDetails(result, item);
            result.DateLastReconciled = item.DateLastReconciled ?? DateTimeOffset.UtcNow;
            result.RetryCount = null;
            result.ErrorReason = null;
            break;

          case PayoutTransactionStatus.Failed:
            if (!Statuses_CanFail.Contains(result.Status))
              throw new ValidationException($"{nameof(PayoutTransaction)} can not be failed (current status '{result.Status}'). Required state '{Statuses_CanFail.JoinNames()}'");

            ApplyProviderDetails(result, item);
            result.DateLastReconciled = item.DateLastReconciled ?? DateTimeOffset.UtcNow;
            result.RetryCount = null;
            result.ErrorReason = item.ErrorReason;
            break;

          case PayoutTransactionStatus.Cancelled:
            if (!Statuses_CanCancel.Contains(result.Status))
              throw new ValidationException($"{nameof(PayoutTransaction)} can not be cancelled (current status '{result.Status}'). Required state '{Statuses_CanCancel.JoinNames()}'");

            ApplyProviderDetails(result, item);
            result.DateLastReconciled = item.DateLastReconciled ?? DateTimeOffset.UtcNow;
            result.RetryCount = null;
            result.ErrorReason = item.ErrorReason;
            break;

          case PayoutTransactionStatus.Expired:
            if (!Statuses_CanExpire.Contains(result.Status))
              throw new ValidationException($"{nameof(PayoutTransaction)} can not be expired (current status '{result.Status}'). Required state '{Statuses_CanExpire.JoinNames()}'");

            ApplyProviderDetails(result, item);
            result.DateLastReconciled = item.DateLastReconciled ?? DateTimeOffset.UtcNow;
            result.RetryCount = null;
            result.ErrorReason = item.ErrorReason;
            break;

          default:
            throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(PayoutTransactionStatus)} of '{item.Status}' not supported");
        }

        result.StatusId = _payoutTransactionStatusService.GetByName(item.Status.ToString()).Id;
        result.Status = item.Status;
        result = await _payoutTransactionRepository.Update(result);

        scope.Complete();
      });

      return result ?? throw new DataInconsistencyException("Payout transaction status update did not return a result");
    }
    #endregion

    #region Private Members
    private PayoutTransaction GetById(Guid id, LockMode? lockMode)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var query = lockMode.HasValue ? _payoutTransactionRepository.Query(lockMode.Value) : _payoutTransactionRepository.Query();
      var result = query.SingleOrDefault(o => o.Id == id);

      return result ?? throw new EntityNotFoundException($"{nameof(PayoutTransaction)} with id '{id}' does not exist");
    }

    private static void ApplyProviderDetails(PayoutTransaction target, PayoutTransaction source)
    {
      if (!string.IsNullOrEmpty(source.TransactionId))
      {
        if (!string.IsNullOrEmpty(target.TransactionId) &&
            !string.Equals(target.TransactionId, source.TransactionId, StringComparison.Ordinal))
          throw new DataInconsistencyException($"Transaction id mismatch detected for payout transaction with id '{target.Id}'");

        target.TransactionId = source.TransactionId;
      }

      target.ExpiresAt = source.ExpiresAt ?? target.ExpiresAt;
    }
    #endregion
  }
}
