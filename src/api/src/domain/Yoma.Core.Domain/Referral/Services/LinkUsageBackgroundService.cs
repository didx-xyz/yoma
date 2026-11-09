using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Services
{
  public class LinkUsageBackgroundService : ILinkUsageBackgroundService
  {
    #region Class Variables
    private readonly ILogger<LinkUsageBackgroundService> _logger;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly IServiceScopeFactory _scopeFactory;

    private readonly ILinkUsageStatusService _linkUsageStatusService;
    private readonly IDistributedLockService _distributedLockService;

    private readonly IRepositoryBatched<ReferralLinkUsage> _linkUsageRepository;

    internal static readonly ReferralLinkUsageStatus[] Statuses_Expirable = [ReferralLinkUsageStatus.Pending];
    internal static readonly ReferralLinkUsageStatus[] Statuses_Abandonable = [ReferralLinkUsageStatus.Initiated];

    #endregion

    #region Constructor
    public LinkUsageBackgroundService(
      ILogger<LinkUsageBackgroundService> logger,
      IOptions<ScheduleJobOptions> scheduleJobOptions,
      IServiceScopeFactory scopeFactory,

      IDistributedLockService distributedLockService,
      ILinkUsageStatusService linkUsageStatusService,

      IRepositoryBatched<ReferralLinkUsage> linkUsageRepository)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _scheduleJobOptions = scheduleJobOptions.Value ?? throw new ArgumentNullException(nameof(scheduleJobOptions));
      _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

      _distributedLockService = distributedLockService ?? throw new ArgumentNullException(nameof(distributedLockService));
      _linkUsageStatusService = linkUsageStatusService ?? throw new ArgumentNullException(nameof(linkUsageStatusService));

      _linkUsageRepository = linkUsageRepository ?? throw new ArgumentNullException(nameof(linkUsageRepository));
    }
    #endregion

    #region Public Members
    /// <summary>
    /// Manual recovery sweep, not an expiry override. Snapshot only distinct user IDs so
    /// incomplete claims cannot repeat indefinitely or cause offset paging to skip work.
    /// Each user is processed sequentially in a fresh scope, using the normal per-user
    /// lock, transactions, completion rules and reward scheduling. Re-running is safe:
    /// the processor rechecks Pending status and never reopens terminal claims.
    /// </summary>
    public async Task ProcessPendingProgress(CancellationToken cancellationToken)
    {
      const string lockIdentifier = "referral_link_usage_process_pending_progress";
      cancellationToken.ThrowIfCancellationRequested();

      if (_scheduleJobOptions.DefaultScheduleMaxIntervalInHours <= 0
        || _scheduleJobOptions.DistributedLockDurationBufferInMinutes <= 0)
        throw new InvalidOperationException("A positive processing interval and lock buffer are required for referral progress recovery");

      var executeUntil = DateTimeOffset.UtcNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - DateTimeOffset.UtcNow
        + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var processed = 0;
      var failed = 0;

      var lockAcquired = await _distributedLockService.TryRunWithLockAsync(lockIdentifier, lockDuration, TimeSpan.Zero, async () =>
      {
        cancellationToken.ThrowIfCancellationRequested();
        var statusPendingId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Pending.ToString()).Id;
        var userIds = _linkUsageRepository.Query()
          .Where(o => o.StatusId == statusPendingId)
          .Select(o => o.UserId)
          .Distinct()
          .OrderBy(o => o)
          .ToList();

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation(
          "Processing referral Pending progress for {Count} users; normal expiry rules apply", userIds.Count);

        foreach (var userId in userIds)
        {
          cancellationToken.ThrowIfCancellationRequested();
          if (DateTimeOffset.UtcNow >= executeUntil)
            throw new TimeoutException("Referral Pending progress sweep reached its processing interval; review progress before triggering again");

          try
          {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var service = scope.ServiceProvider.GetRequiredService<ILinkUsageService>();
            await service.ProcessProgressByUserId(userId);
            processed++;
          }
          catch (Exception ex) when (!cancellationToken.IsCancellationRequested && ex is not OperationCanceledException)
          {
            failed++;
            if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex,
              "Failed to re-evaluate referral Pending progress for user {UserId}", userId);
          }
        }

        // A successful evaluation may leave claims Pending (requirements outstanding or
        // onboarding incomplete), complete them, or expire them under the existing rules.
        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation(
          "Re-evaluated referral Pending progress: {Processed} users processed, {Failed} failed, {Total} selected",
          processed, failed, userIds.Count);

        if (failed > 0)
          throw new InvalidOperationException($"Referral Pending progress sweep had {failed} failed users; review logs before triggering again");
      }, cancellationToken);

      if (!lockAcquired && _logger.IsEnabled(LogLevel.Warning))
        _logger.LogWarning("Referral Pending progress sweep already running; skipped this invocation");
    }

    public async Task ProcessExpiration()
    {
      const string lockIdentifier = "referral_link_usage_process_expiration";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processing link usage expiration");

        var statusExpiredId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Expired.ToString()).Id;
        var statusExpirableIds = Statuses_Expirable.Select(o => _linkUsageStatusService.GetByName(o.ToString()).Id).ToList();

        while (executeUntil > DateTimeOffset.UtcNow)
        {
          var now = DateTimeOffset.UtcNow;

          var items = _linkUsageRepository.Query().Where(o =>
            statusExpirableIds.Contains(o.StatusId) &&
            o.ProgramCompletionWindowInDays.HasValue)
            .OrderBy(o => o.DateClaimed ?? DateTimeOffset.MaxValue)
            .Take(_scheduleJobOptions.ReferralLinkUsageExpirationScheduleBatchSize)
            .ToList();

          if (items.Count == 0) break;

          var itemsToExpire = new List<ReferralLinkUsage>();

          items.ForEach(o =>
          {
            if (!o.DateClaimed.HasValue)
              throw new DataInconsistencyException($"Expected DateClaimed to have value for expirable LinkUsage '{o.Id}' but it is null");

            if (o.DateClaimed <= now.AddDays(-o.ProgramCompletionWindowInDays!.Value))
            {
              o.StatusId = statusExpiredId;
              o.Status = ReferralLinkUsageStatus.Expired;
              itemsToExpire.Add(o);

              if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation(
                "Expiring LinkUsage '{LinkUsageId}' (claimed {DateClaimed:yyyy-MM-dd}, window {WindowDays} days, program {ProgramId}, link {LinkId})",
                o.Id, o.DateClaimed, o.ProgramCompletionWindowInDays, o.ProgramId, o.LinkId);
            }
          });

          if (itemsToExpire.Count == 0) break;

          await _linkUsageRepository.Update(itemsToExpire);

          if (executeUntil <= DateTimeOffset.UtcNow) break;
        }

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processed link usage expiration");
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessExpiration), ex.Message);
      }
      finally
      {
        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }

    public async Task ProcessAbandoned()
    {
      const string lockIdentifier = "referral_link_usage_process_abandoned";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processing link usage abandonment");

        var statusAbandonedId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Abandoned.ToString()).Id;
        var statusAbandonableIds = Statuses_Abandonable.Select(o => _linkUsageStatusService.GetByName(o.ToString()).Id).ToList();

        while (executeUntil > DateTimeOffset.UtcNow)
        {
          var now = DateTimeOffset.UtcNow;

          var items = _linkUsageRepository.Query().Where(o =>
            statusAbandonableIds.Contains(o.StatusId))
            .OrderBy(o => o.DateInitiated ?? DateTimeOffset.MaxValue)
            .Take(_scheduleJobOptions.ReferralLinkUsageAbandonedBatchSize)
            .ToList();

          if (items.Count == 0) break;

          var itemsToAbandon = new List<ReferralLinkUsage>();

          items.ForEach(o =>
          {
            if (!o.DateInitiated.HasValue)
              throw new DataInconsistencyException($"Expected DateInitiated to have value for abandonable LinkUsage '{o.Id}' but it is null");

            if (o.DateInitiated <= now.AddHours(-_scheduleJobOptions.ReferralLinkUsageAbandonedIntervalInHours))
            {
              o.StatusId = statusAbandonedId;
              o.Status = ReferralLinkUsageStatus.Abandoned;
              itemsToAbandon.Add(o);

              if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation(
                "Abandoning LinkUsage '{LinkUsageId}' (initiated {DateInitiated:yyyy-MM-dd HH:mm}, timeout {TimeoutHours} hours, program {ProgramId}, link {LinkId})",
                o.Id, o.DateInitiated, _scheduleJobOptions.ReferralLinkUsageAbandonedIntervalInHours, o.ProgramId, o.LinkId);
            }
          });

          if (itemsToAbandon.Count == 0) break;

          await _linkUsageRepository.Update(itemsToAbandon);

          if (executeUntil <= DateTimeOffset.UtcNow) break;
        }

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processed link usage abandonment");
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessAbandoned), ex.Message);
      }
      finally
      {
        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion
  }
}
