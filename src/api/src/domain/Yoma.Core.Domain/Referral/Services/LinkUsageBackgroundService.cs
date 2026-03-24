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

      IDistributedLockService distributedLockService,
      ILinkUsageStatusService linkUsageStatusService,

      IRepositoryBatched<ReferralLinkUsage> linkUsageRepository)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _scheduleJobOptions = scheduleJobOptions.Value ?? throw new ArgumentNullException(nameof(scheduleJobOptions));

      _distributedLockService = distributedLockService ?? throw new ArgumentNullException(nameof(distributedLockService));
      _linkUsageStatusService = linkUsageStatusService ?? throw new ArgumentNullException(nameof(linkUsageStatusService));

      _linkUsageRepository = linkUsageRepository ?? throw new ArgumentNullException(nameof(linkUsageRepository));
    }
    #endregion

    #region Public Members
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
