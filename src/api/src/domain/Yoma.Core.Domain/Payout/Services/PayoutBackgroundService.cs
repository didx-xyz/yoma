using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Payout.Interfaces;

namespace Yoma.Core.Domain.Payout.Services
{
  public sealed class PayoutBackgroundService : IPayoutBackgroundService
  {
    #region Class Variables
    private readonly ILogger<PayoutBackgroundService> _logger;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly IPayoutService _payoutService;
    private readonly IDistributedLockService _distributedLockService;
    private readonly IHostApplicationLifetime _applicationLifetime;
    #endregion

    #region Constructor
    public PayoutBackgroundService(
      ILogger<PayoutBackgroundService> logger,
      IOptions<ScheduleJobOptions> scheduleJobOptions,
      IPayoutService payoutService,
      IDistributedLockService distributedLockService,
      IHostApplicationLifetime applicationLifetime)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _scheduleJobOptions = (scheduleJobOptions ?? throw new ArgumentNullException(nameof(scheduleJobOptions))).Value;
      _payoutService = payoutService ?? throw new ArgumentNullException(nameof(payoutService));
      _distributedLockService = distributedLockService ?? throw new ArgumentNullException(nameof(distributedLockService));
      _applicationLifetime = applicationLifetime ?? throw new ArgumentNullException(nameof(applicationLifetime));
    }
    #endregion

    #region Public Members
    /// <summary>
    /// Reconciles active payouts as a fallback for missed or delayed webhooks and resumes work interrupted
    /// between local persistence and provider calls. Terminal outcomes must still be confirmed by the payout
    /// provider; local expiration timestamps alone never release reserved rewards.
    /// </summary>
    public async Task ProcessReconciliation()
    {
      const string lockIdentifier = "payout_process_reconciliation";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      await using var job = BackgroundJobExecutionScope.CreateWithLock(_applicationLifetime, _distributedLockService, _logger);

      try
      {
        if (!await job.TryAcquireLockAsync(lockIdentifier, lockDuration)) return;

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processing payout reconciliation");

        var itemIdsToSkip = new List<Guid>();
        while (executeUntil > DateTimeOffset.UtcNow)
        {
          job.ThrowIfStopping();
          var items = _payoutService.ListForReconciliation(_scheduleJobOptions.PayoutReconciliationScheduleBatchSize, itemIdsToSkip);
          if (items.Count == 0) break;

          foreach (var item in items)
          {
            job.ThrowIfStopping();
            try
            {
              if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Reconciling payout transaction with id '{id}'", item.Id);

              await _payoutService.Reconcile(item.Id);

              if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Reconciled payout transaction with id '{id}'", item.Id);
            }
            catch (Exception ex) when (!job.IsStopping)
            {
              if (_logger.IsEnabled(LogLevel.Error))
                _logger.LogError(ex, "Failed to reconcile payout transaction with id '{id}': {errorMessage}", item.Id, ex.Message);
            }
            finally
            {
              itemIdsToSkip.Add(item.Id);
            }

            if (executeUntil <= DateTimeOffset.UtcNow) break;
          }
        }

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processed payout reconciliation");
      }
      catch (Exception ex)
      {
        job.ThrowIfStopping(ex);

        if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessReconciliation), ex.Message);
      }
    }
    #endregion
  }
}
