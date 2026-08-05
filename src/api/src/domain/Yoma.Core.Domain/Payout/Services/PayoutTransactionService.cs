using FluentValidation;
using System.Transactions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Payout.Interfaces;
using Yoma.Core.Domain.Payout.Interfaces.Lookups;
using Yoma.Core.Domain.Payout.Models;

namespace Yoma.Core.Domain.Payout.Services
{
  public sealed class PayoutTransactionService : IPayoutTransactionService
  {
    #region Class Variables
    private readonly IPayoutTransactionStatusService _payoutTransactionStatusService;
    private readonly IRepository<PayoutTransaction> _payoutTransactionRepository;
    private readonly IExecutionStrategyService _executionStrategyService;

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
      IExecutionStrategyService executionStrategyService)
    {
      _payoutTransactionStatusService = payoutTransactionStatusService ?? throw new ArgumentNullException(nameof(payoutTransactionStatusService));
      _payoutTransactionRepository = payoutTransactionRepository ?? throw new ArgumentNullException(nameof(payoutTransactionRepository));
      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));
    }
    #endregion

    #region Public Members
    public PayoutTransaction GetById(Guid id)
    {
      return GetById(id, null);
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
