using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Transactions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Payout.Extensions;
using Yoma.Core.Domain.Payout.Interfaces;
using Yoma.Core.Domain.Payout.Interfaces.Lookups;
using Yoma.Core.Domain.Payout.Interfaces.Provider;
using Yoma.Core.Domain.Payout.Models;
using Yoma.Core.Domain.Payout.Models.Provider;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Domain.Reward.Interfaces.Provider;
using Yoma.Core.Domain.Reward.Models;
using Yoma.Core.Domain.Reward.Models.Provider;
using Yoma.Core.Domain.Treasury.Extensions;
using Yoma.Core.Domain.Treasury.Interfaces;
using PayoutProvider = Yoma.Core.Domain.Payout.Provider;

namespace Yoma.Core.Domain.Payout.Services
{
  public sealed class PayoutService : IPayoutService
  {
    #region Class Variables
    private readonly ILogger<PayoutService> _logger;
    private readonly TimeSpan _payoutLockDuration;
    private readonly TimeSpan _payoutRewardReservationExpiration;
    private readonly IDistributedLockService _distributedLockService;
    private readonly IUserService _userService;
    private readonly IWalletService _walletService;
    private readonly IRewardService _rewardService;
    private readonly IRewardProviderClient _rewardProviderClient;
    private readonly IPayoutTransactionService _payoutTransactionService;
    private readonly IRepository<PayoutTransaction> _payoutTransactionRepository;
    private readonly IPayoutTransactionStatusService _payoutTransactionStatusService;
    private readonly IPayoutProviderClient _payoutProviderClient;
    private readonly ITreasuryService _treasuryService;
    private readonly IExecutionStrategyService _executionStrategyService;

    private static readonly PayoutTransactionStatus[] Statuses_Active =
      [PayoutTransactionStatus.Initiated, PayoutTransactionStatus.Processing, PayoutTransactionStatus.ReconciliationRequired];

    private const string LockIdentifier_Prefix = "payout";
    private const PayoutProvider Provider_Default = PayoutProvider.YellowCard;
    #endregion

    #region Constructor
    public PayoutService(
      ILogger<PayoutService> logger,
      IOptions<AppSettings> appSettings,
      IDistributedLockService distributedLockService,
      IUserService userService,
      IWalletService walletService,
      IRewardService rewardService,
      IRewardProviderClientFactory rewardProviderClientFactory,
      IPayoutTransactionService payoutTransactionService,
      IRepository<PayoutTransaction> payoutTransactionRepository,
      IPayoutTransactionStatusService payoutTransactionStatusService,
      IPayoutProviderClientFactory payoutProviderClientFactory,
      ITreasuryService treasuryService,
      IExecutionStrategyService executionStrategyService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      var settings = (appSettings ?? throw new ArgumentNullException(nameof(appSettings))).Value;
      if (settings.DistributedLockPayoutDurationInSeconds <= 0)
        throw new InvalidOperationException($"{nameof(AppSettings)}:{nameof(settings.DistributedLockPayoutDurationInSeconds)} must be greater than zero");
      _payoutLockDuration = TimeSpan.FromSeconds(settings.DistributedLockPayoutDurationInSeconds);
      if (settings.PayoutRewardReservationExpirationInMinutes <= 0)
        throw new InvalidOperationException($"{nameof(AppSettings)}:{nameof(settings.PayoutRewardReservationExpirationInMinutes)} must be greater than zero");
      _payoutRewardReservationExpiration = TimeSpan.FromMinutes(settings.PayoutRewardReservationExpirationInMinutes);
      _distributedLockService = distributedLockService ?? throw new ArgumentNullException(nameof(distributedLockService));
      _userService = userService ?? throw new ArgumentNullException(nameof(userService));
      _walletService = walletService ?? throw new ArgumentNullException(nameof(walletService));
      _rewardService = rewardService ?? throw new ArgumentNullException(nameof(rewardService));
      _rewardProviderClient = (rewardProviderClientFactory ?? throw new ArgumentNullException(nameof(rewardProviderClientFactory))).CreateClient();
      _payoutTransactionService = payoutTransactionService ?? throw new ArgumentNullException(nameof(payoutTransactionService));
      _payoutTransactionRepository = payoutTransactionRepository ?? throw new ArgumentNullException(nameof(payoutTransactionRepository));
      _payoutTransactionStatusService = payoutTransactionStatusService ?? throw new ArgumentNullException(nameof(payoutTransactionStatusService));
      _payoutProviderClient = (payoutProviderClientFactory ?? throw new ArgumentNullException(nameof(payoutProviderClientFactory))).CreateClient();
      _treasuryService = treasuryService ?? throw new ArgumentNullException(nameof(treasuryService));
      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));
    }
    #endregion

    #region Public Members

    public async Task<PayoutTransaction> Payout(Guid userId, decimal amount)
    {
      var user = GetUser(userId);
      var payout = await CreatePayout(userId, PayoutType.Payout, Provider_Default, amount, null, false);

      var result = await _distributedLockService.RunWithLockAsync(GetLockKey(payout.Id), _payoutLockDuration, () => InitiatePayout(payout, user));
      return result.Payout;
    }

    public async Task<PayoutSession> PayoutRewards(Guid userId, decimal amount)
    {
      if (userId == Guid.Empty)
        throw new ArgumentNullException(nameof(userId));

      var rewardReservationExpiresAt = DateTimeOffset.UtcNow.Add(_payoutRewardReservationExpiration);
      return await PayoutRewards(userId, amount, rewardReservationExpiresAt);
    }

    public async Task<PayoutSession> GetSession(Guid userId)
    {
      if (userId == Guid.Empty)
        throw new ArgumentNullException(nameof(userId));

      var payout = _payoutTransactionService.GetActiveByUserIdOrNull(userId)
        ?? throw new EntityNotFoundException("No active payout exists for the current user");

      return await _distributedLockService.RunWithLockAsync(GetLockKey(payout.Id), _payoutLockDuration, async () =>
      {
        payout = GetPayout(payout.Id);
        EnsureActive(payout);

        if (string.IsNullOrEmpty(payout.TransactionId))
          throw new InvalidOperationException("The payout provider session is not yet available");

        var response = await _payoutProviderClient.GetSession(new PayoutSessionRequest
        {
          Id = payout.Id,
          TransactionId = payout.TransactionId
        });

        var session = response.ToPayoutSession(payout);
        payout.ExpiresAt = session.ExpiresAt;
        await _payoutTransactionService.UpdateTransaction(payout);

        return session;
      });
    }

    public async Task ProcessStatus(PayoutStatusResponse response)
    {
      ArgumentNullException.ThrowIfNull(response, nameof(response));

      var transactionId = response.TransactionId?.Trim();
      if (string.IsNullOrEmpty(transactionId))
        throw new ArgumentNullException(nameof(response), "Provider transaction id is empty");
      response.TransactionId = transactionId;

#pragma warning disable CA1862 // The StringComparison overload cannot be translated by Entity Framework
      var payout = _payoutTransactionRepository.Query().SingleOrDefault(o =>
        o.Provider.ToLower() == response.Provider.ToString().ToLower() && o.TransactionId == response.TransactionId);
#pragma warning restore CA1862

      if (payout == null)
        throw new EntityNotFoundException($"{nameof(PayoutTransaction)} with provider transaction id '{response.TransactionId}' does not exist");

      await _distributedLockService.RunWithLockAsync(GetLockKey(payout.Id), _payoutLockDuration, () => ProcessStatus(payout, response));
    }

    public List<PayoutTransaction> ListForReconciliation(int batchSize, List<Guid> idsToSkip)
    {
      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(batchSize, default, nameof(batchSize));

      var statusIds = Statuses_Active.Select(o => _payoutTransactionStatusService.GetByName(o.ToString()).Id).ToList();
      var query = _payoutTransactionRepository.Query().Where(o => statusIds.Contains(o.StatusId));

      if (idsToSkip != null && idsToSkip.Count != 0)
        query = query.Where(o => !idsToSkip.Contains(o.Id));

      return [.. query.OrderBy(o => o.DateLastReconciled ?? o.DateModified).ThenBy(o => o.Id).Take(batchSize)];
    }

    public async Task Reconcile(Guid id)
    {
      await _distributedLockService.RunWithLockAsync(GetLockKey(id), _payoutLockDuration, () => ReconcileProcess(id));
    }
    #endregion

    #region Private Members
    private async Task<PayoutSession> PayoutRewards(Guid userId, decimal amount, DateTimeOffset rewardReservationExpiresAt)
    {
      // TODO [Yellow Card payout expiration]: Once the provider contract is confirmed, set the ZLTO reservation
      // expiry after the Yellow Card payout expiry plus a processing buffer for delayed responses, reconciliation
      // and retries. ZLTO imposes no duration limits and treats this as a threshold for asynchronous auto-release.
      if (rewardReservationExpiresAt <= DateTimeOffset.UtcNow)
        throw new ArgumentOutOfRangeException(nameof(rewardReservationExpiresAt), "ZLTO reservation expiration must be in the future");

      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(amount, default, nameof(amount));
      if (decimal.Truncate(amount) != amount)
        throw new ArgumentException("Payout amount must be a whole number", nameof(amount));

      var user = GetUser(userId);
      var (walletStatus, walletBalance) = await _walletService.GetWalletStatusAndBalance(userId);
      if (walletStatus != Reward.WalletCreationStatus.Created)
        throw new ValidationException("The reward wallet is not ready for payout");

      if (string.IsNullOrEmpty(walletBalance.WalletId))
        throw new InvalidOperationException($"Wallet id expected with status '{walletStatus}'");

      if (walletBalance.Available < amount)
        throw new ValidationException($"Insufficient reward balance for payout. Current available balance '{walletBalance.Available:N2}'");

      var payout = await CreatePayout(userId, PayoutType.PayoutRewards, Provider_Default, amount, rewardReservationExpiresAt, true);

      return await _distributedLockService.RunWithLockAsync(GetLockKey(payout.Id), _payoutLockDuration, async () =>
      {
        ReservePayoutResponse reservation;
        try
        {
          reservation = await _rewardProviderClient.ReserveForPayout(new ReservePayoutRequest
          {
            TransactionId = payout.Id,
            WalletId = walletBalance.WalletId,
            Amount = amount,
            ExpiresAt = rewardReservationExpiresAt
          });
        }
        catch (Exception ex)
        {
          await TryMarkFailedBeforePayout(payout, $"Failed to reserve rewards for payout: {ex.Message}");
          throw;
        }

        try
        {
          await _rewardService.RecordTransaction(userId, Reward.RewardTransactionEntityType.Payout, payout.Id, Reward.RewardTransactionStatus.Reserved, amount, reservation.Id, rewardReservationExpiresAt);
        }
        catch (Exception ex)
        {
          var released = await TryReleaseReservation(reservation.Id, "Payout reservation could not be recorded");
          if (released)
            await TryMarkFailedBeforePayout(payout, $"Failed to record the reward payout reservation: {ex.Message}");
          else
            await TryMarkReconciliationRequired(payout, $"Reward reservation succeeded but could not be recorded or released: {ex.Message}");
          throw;
        }

        var result = await InitiatePayout(payout, user);
        return result.Session;
      });
    }

    private async Task ReconcileProcess(Guid id)
    {
      var payout = GetPayout(id);
      if (!Statuses_Active.Contains(payout.Status)) return;

      try
      {
        // ZLTO exposes reservation retrieval only by reservation id. If both persistence and the immediate release
        // fail after a successful reservation, Yoma has no durable reservation id to reconcile. No payout was
        // initiated, so do not query the payout provider: wait for the ZLTO expiry threshold, close the local payout,
        // and let ZLTO's expiry processor release the wallet balance. Until then the reduced available balance
        // intentionally prevents the user from starting another payout with the same reserved funds.
        if (IsRewardPayout(payout) && string.IsNullOrEmpty(payout.TransactionId))
        {
          var rewardTransaction = _rewardService.GetByEntity(payout.UserId, Reward.RewardTransactionEntityType.Payout, payout.Id);
          if (rewardTransaction == null)
          {
            if (payout.RewardReservationExpiresAt.HasValue && payout.RewardReservationExpiresAt.Value <= DateTimeOffset.UtcNow)
              await TryMarkFailedBeforePayout(payout, "Reward reservation was not recorded and its expiration threshold elapsed");
            return;
          }
        }

        if (payout.Status == PayoutTransactionStatus.Initiated)
        {
          // ReconcileProcess owns failure-state persistence for this attempt so RetryCount is
          // incremented once even when provider initiation must be retried from Initiated.
          await InitiatePayout(payout, GetUser(payout.UserId), false);
          return;
        }

        // TODO [Yellow Card]: Confirm lookup by Yoma idempotency key when TransactionId is unknown.
        // If unsupported, define safe idempotent re-initiation; never risk creating a duplicate payout.
        var response = await _payoutProviderClient.GetStatus(new PayoutStatusRequest
        {
          Id = payout.Id,
          TransactionId = payout.TransactionId
        });

        await ProcessStatus(payout, response);
      }
      catch (Exception ex)
      {
        await TryMarkReconciliationRequired(payout, ex.Message);
        throw;
      }
    }

    private User GetUser(Guid userId)
    {
      if (userId == Guid.Empty)
        throw new ArgumentNullException(nameof(userId));

      return _userService.GetById(userId, false, false);
    }

    private async Task<PayoutTransaction> CreatePayout(
      Guid userId,
      PayoutType type,
      PayoutProvider provider,
      decimal amount,
      DateTimeOffset? rewardReservationExpiresAt,
      bool convertFromZlto)
    {
      PayoutTransaction? payout = null;
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

        var treasury = _treasuryService.Get(LockMode.Wait);
        await _treasuryService.EnsureCurrentFinancialYear(treasury);

        if (_payoutTransactionService.GetActiveByUserIdOrNull(userId) != null)
          throw new ValidationException("A payout is already in progress");

        var payoutAmount = convertFromZlto
          ? Math.Round(amount * treasury.ConversionRateZltoUsd, 2, MidpointRounding.AwayFromZero)
          : amount;

        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(payoutAmount, default, nameof(amount));

        // Check pool availability before creating the payout. The available balance is the current financial year pool
        // less the current financial year cumulative and all pending payouts. Once created, payout processing is not
        // blocked if the pool is later depleted. The cumulative increases only when the payout is paid out.
        // A null pool intentionally represents uncapped payout processing. Validation currently requires
        // a configured pool, but the domain remains ready for that policy to be relaxed.
        var payoutTotalPending = _payoutTransactionService.GetTotalPending();
        var payoutBalanceAvailable = treasury.CalculatePayoutBalanceAvailableCurrentFinancialYearInUsd(payoutTotalPending);
        if (payoutBalanceAvailable.HasValue && payoutAmount > payoutBalanceAvailable.Value)
          throw new ValidationException("There are insufficient funds available to complete this payout");

        payout = await _payoutTransactionService.Create(userId, type, provider, payoutAmount, rewardReservationExpiresAt);

        scope.Complete();
      });

      return payout ?? throw new DataInconsistencyException("Payout creation did not return a result");
    }

    private async Task<(PayoutTransaction Payout, PayoutSession Session)> InitiatePayout(
      PayoutTransaction payout,
      User user,
      bool markReconciliationOnFailure = true)
    {
      try
      {
        // TODO [Yellow Card communication]: Confirm whether IXO / Yellow Card communicates payout progress
        // and terminal outcomes directly to the user. If not, Yoma must send its own notifications.
        var response = await _payoutProviderClient.Initiate(new PayoutRequest
        {
          TransactionId = payout.Id,
          Email = user.Email,
          PhoneNumber = user.PhoneNumber,
          AmountInUSD = payout.Amount
        });

        var transactionId = response.TransactionId?.Trim();
        if (string.IsNullOrEmpty(transactionId))
          throw new InvalidOperationException("Provider transaction id expected after initiating payout");

        var session = response.ToPayoutSession(payout);
        payout.TransactionId = transactionId;
        // Provider expiry is informational. Only a provider-confirmed terminal status may close the
        // payout or release its reward reservation.
        payout.ExpiresAt = session.ExpiresAt;
        payout.DateLastReconciled = DateTimeOffset.UtcNow;
        payout.RetryCount = null;
        payout.Status = PayoutTransactionStatus.Processing;

        payout = await _payoutTransactionService.UpdateTransaction(payout);
        return (payout, session);
      }
      catch (Exception ex)
      {
        if (markReconciliationOnFailure)
          await TryMarkReconciliationRequired(payout, $"Payout initiation outcome is not confirmed: {ex.Message}");
        throw;
      }
    }

    private async Task ProcessStatus(PayoutTransaction payout, PayoutStatusResponse response)
    {
      var transactionId = response.TransactionId?.Trim();
      if (string.IsNullOrEmpty(transactionId))
        throw new ArgumentNullException(nameof(response), "Provider transaction id is empty");
      response.TransactionId = transactionId;

      if (!string.Equals(payout.Provider, response.Provider.ToString(), StringComparison.OrdinalIgnoreCase))
        throw new DataInconsistencyException($"Payout provider mismatch detected for payout transaction with id '{payout.Id}'");

      if (!string.IsNullOrEmpty(payout.TransactionId) &&
          !string.Equals(payout.TransactionId, response.TransactionId, StringComparison.Ordinal))
        throw new DataInconsistencyException($"Provider transaction id mismatch detected for payout transaction with id '{payout.Id}'");

      // The first confirmed provider response may already be terminal. Carry its transaction id
      // through every status path so it is persisted for audit and reconciliation.
      payout.TransactionId = response.TransactionId;
      switch (response.Status)
      {
        case PayoutTransactionStatus.Processing:
          payout.DateLastReconciled = DateTimeOffset.UtcNow;
          payout.RetryCount = null;
          payout.ErrorReason = null;
          payout.Status = PayoutTransactionStatus.Processing;
          await _payoutTransactionService.UpdateTransaction(payout);
          break;

        case PayoutTransactionStatus.Completed:
          await Complete(payout);
          break;

        case PayoutTransactionStatus.Failed:
        case PayoutTransactionStatus.Cancelled:
        case PayoutTransactionStatus.Expired:
          await CloseUnsuccessful(payout, response.Status, response.ErrorReason);
          break;

        default:
          throw new ArgumentOutOfRangeException(nameof(response), $"Provider payout status of '{response.Status}' is not supported");
      }
    }

    private async Task Complete(PayoutTransaction payout)
    {
      // The ZLTO reservation must outlive the provider payout and processing buffer (see the initiation TODO).
      // A provider-confirmed payment must never be marked Completed locally unless the reward burn was
      // committed successfully.
      RewardTransaction? rewardTransaction = null;
      if (IsRewardPayout(payout))
      {
        rewardTransaction = _rewardService.GetByEntity(payout.UserId, Reward.RewardTransactionEntityType.Payout, payout.Id)
          ?? throw new DataInconsistencyException($"Reward payout transaction expected for payout transaction with id '{payout.Id}'");

        if (rewardTransaction.Status == Reward.RewardTransactionStatus.Released)
          throw new DataInconsistencyException($"Reward reservation was released before completed payout transaction with id '{payout.Id}' was finalized");

        if (rewardTransaction.Status == Reward.RewardTransactionStatus.Reserved)
        {
          await _rewardProviderClient.CommitPayoutReservation(new CommitPayoutReservationRequest
          {
            ReservationId = rewardTransaction.TransactionId!,
            ExternalTransactionReference = payout.TransactionId
          });
        }
      }

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

        var payoutLocked = GetPayout(payout.Id, LockMode.Wait);
        if (payoutLocked.Status == PayoutTransactionStatus.Completed)
        {
          scope.Complete();
          return;
        }

        EnsureActive(payoutLocked);
        ApplyProviderDetails(payoutLocked, payout);

        if (IsRewardPayout(payoutLocked))
        {
          var rewardTransactionLocked = _rewardService.GetByEntity(payoutLocked.UserId, Reward.RewardTransactionEntityType.Payout, payoutLocked.Id, LockMode.Wait)
            ?? throw new DataInconsistencyException($"Reward payout transaction expected for payout transaction with id '{payoutLocked.Id}'");

          if (rewardTransactionLocked.Status == Reward.RewardTransactionStatus.Released)
            throw new DataInconsistencyException($"Released reward reservation cannot complete payout transaction with id '{payoutLocked.Id}'");

          if (rewardTransactionLocked.Status != Reward.RewardTransactionStatus.Processed)
          {
            rewardTransactionLocked.Status = Reward.RewardTransactionStatus.Processed;
            await _rewardService.UpdateTransaction(rewardTransactionLocked);
          }
        }

        // Complete the pending payout without checking the pool again. Add the paid amount to the lifetime and current
        // financial year cumulatives, then mark the payout terminal in the same transaction. Removing it from the pending
        // total prevents the payout balance available from being reduced twice.
        var treasury = _treasuryService.Get(LockMode.Wait);
        await _treasuryService.PayoutCompleted(treasury, payoutLocked.Amount);

        await UpdatePayoutTerminal(payoutLocked, PayoutTransactionStatus.Completed, null);

        scope.Complete();
      });
    }

    private async Task CloseUnsuccessful(PayoutTransaction payout, PayoutTransactionStatus status, string? reason)
    {
      if (IsRewardPayout(payout))
      {
        var rewardTransaction = _rewardService.GetByEntity(payout.UserId, Reward.RewardTransactionEntityType.Payout, payout.Id)
          ?? throw new DataInconsistencyException($"Reward payout transaction expected for payout transaction with id '{payout.Id}'");

        if (rewardTransaction.Status == Reward.RewardTransactionStatus.Processed)
          throw new DataInconsistencyException($"Processed reward burn cannot be released for payout transaction with id '{payout.Id}'");

        if (rewardTransaction.Status == Reward.RewardTransactionStatus.Reserved)
        {
          await _rewardProviderClient.ReleasePayoutReservation(new ReleasePayoutReservationRequest
          {
            ReservationId = rewardTransaction.TransactionId!,
            Reason = reason
          });
        }
      }

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

        var payoutLocked = GetPayout(payout.Id, LockMode.Wait);
        if (payoutLocked.Status == status)
        {
          scope.Complete();
          return;
        }

        EnsureActive(payoutLocked);
        ApplyProviderDetails(payoutLocked, payout);

        if (IsRewardPayout(payoutLocked))
        {
          var rewardTransactionLocked = _rewardService.GetByEntity(payoutLocked.UserId, Reward.RewardTransactionEntityType.Payout, payoutLocked.Id, LockMode.Wait)
            ?? throw new DataInconsistencyException($"Reward payout transaction expected for payout transaction with id '{payoutLocked.Id}'");

          if (rewardTransactionLocked.Status == Reward.RewardTransactionStatus.Processed)
            throw new DataInconsistencyException($"Processed reward burn cannot be released for payout transaction with id '{payoutLocked.Id}'");

          if (rewardTransactionLocked.Status != Reward.RewardTransactionStatus.Released)
          {
            rewardTransactionLocked.Status = Reward.RewardTransactionStatus.Released;
            rewardTransactionLocked.ErrorReason = reason?.Trim();
            await _rewardService.UpdateTransaction(rewardTransactionLocked);
          }
        }

        await UpdatePayoutTerminal(payoutLocked, status, reason);

        scope.Complete();
      });
    }

    private async Task UpdatePayoutTerminal(PayoutTransaction payout, PayoutTransactionStatus status, string? reason)
    {
      payout.StatusId = _payoutTransactionStatusService.GetByName(status.ToString()).Id;
      payout.Status = status;
      payout.ErrorReason = reason?.Trim();
      payout.DateLastReconciled = DateTimeOffset.UtcNow;
      payout.RetryCount = null;
      await _payoutTransactionRepository.Update(payout);
    }

    private async Task TryMarkFailedBeforePayout(PayoutTransaction payout, string reason)
    {
      try
      {
        payout.Status = PayoutTransactionStatus.Failed;
        payout.ErrorReason = reason;
        await _payoutTransactionService.UpdateTransaction(payout);
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Critical))
          _logger.LogCritical(ex, "CRITICAL: Failed to mark payout transaction '{id}' as failed: {errorMessage}", payout.Id, ex.Message);
      }
    }

    private async Task TryMarkReconciliationRequired(PayoutTransaction payout, string reason)
    {
      try
      {
        payout.Status = PayoutTransactionStatus.ReconciliationRequired;
        payout.ErrorReason = reason.Trim();
        payout.DateLastReconciled = DateTimeOffset.UtcNow;
        payout.RetryCount = payout.RetryCount >= byte.MaxValue ? byte.MaxValue : (byte)((payout.RetryCount ?? 0) + 1);
        await _payoutTransactionService.UpdateTransaction(payout);
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Critical))
          _logger.LogCritical(ex, "CRITICAL: Failed to persist reconciliation state for payout transaction '{id}': {errorMessage}", payout.Id, ex.Message);
      }
    }

    /// <summary>
    /// Attempts to release a ZLTO reservation immediately when its domain transaction cannot be persisted. If this
    /// also fails, the reservation id is written to the critical application log but cannot be recovered through the
    /// current ZLTO API. The wallet remains reserved until ZLTO processes its expiry threshold; the payout reconciliation
    /// path waits for that threshold and prevents another payout from using the same balance in the meantime.
    /// </summary>
    private async Task<bool> TryReleaseReservation(string reservationId, string reason)
    {
      try
      {
        await _rewardProviderClient.ReleasePayoutReservation(new ReleasePayoutReservationRequest
        {
          ReservationId = reservationId,
          Reason = reason
        });
        return true;
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Critical))
          _logger.LogCritical(ex, "CRITICAL: Failed to release unrecorded reward reservation '{reservationId}': {errorMessage}", reservationId, ex.Message);
        return false;
      }
    }

    private PayoutTransaction GetPayout(Guid id, LockMode? lockMode = null)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var query = lockMode.HasValue ? _payoutTransactionRepository.Query(lockMode.Value) : _payoutTransactionRepository.Query();
      return query.SingleOrDefault(o => o.Id == id)
        ?? throw new EntityNotFoundException($"{nameof(PayoutTransaction)} with id '{id}' does not exist");
    }

    private static string GetLockKey(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return $"{LockIdentifier_Prefix}:{id}";
    }

    private static bool IsRewardPayout(PayoutTransaction payout)
    {
      return string.Equals(payout.Type, PayoutType.PayoutRewards.ToString(), StringComparison.OrdinalIgnoreCase);
    }

    private static void ApplyProviderDetails(PayoutTransaction target, PayoutTransaction source)
    {
      if (!string.IsNullOrEmpty(source.TransactionId))
      {
        if (!string.IsNullOrEmpty(target.TransactionId) &&
            !string.Equals(target.TransactionId, source.TransactionId, StringComparison.Ordinal))
          throw new DataInconsistencyException($"Provider transaction id mismatch detected for payout transaction with id '{target.Id}'");

        target.TransactionId = source.TransactionId;
      }

      target.ExpiresAt = source.ExpiresAt ?? target.ExpiresAt;
    }

    private static void EnsureActive(PayoutTransaction payout)
    {
      if (!Statuses_Active.Contains(payout.Status))
        throw new DataInconsistencyException($"Payout transaction with id '{payout.Id}' is already terminal with status '{payout.Status}'");
    }
    #endregion
  }
}
