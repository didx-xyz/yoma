using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Transactions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Services
{
  public class ProgramBackgroundService : IProgramBackgroundService
  {
    #region Class Variables
    private readonly ILogger<ProgramBackgroundService> _logger;
    private readonly ScheduleJobOptions _scheduleJobOptions;

    private readonly IUserService _userService;
    private readonly IProgramService _programService;
    private readonly IProgramStatusService _programStatusService;
    private readonly ILinkMaintenanceService _linkMaintenanceService;
    private readonly IDistributedLockService _distributedLockService;
    private readonly IExecutionStrategyService _executionStrategyService;

    private readonly IRepositoryBatchedValueContainsWithNavigation<Program> _programRepository;

    internal static readonly ProgramStatus[] Statuses_Expirable = [ProgramStatus.Active]; //TODO: Include UnCompletable?
    internal static readonly ProgramStatus[] Statuses_Deletion = [ProgramStatus.Inactive];
    internal static readonly ProgramStatus[] Statuses_HealthProbe = [ProgramStatus.Active, ProgramStatus.UnCompletable];
    #endregion

    #region Constructor
    public ProgramBackgroundService(
      ILogger<ProgramBackgroundService> logger,
      IOptions<ScheduleJobOptions> scheduleJobOptions,

      IUserService userService,
      IProgramService programService,
      IProgramStatusService programStatusService,
      ILinkMaintenanceService linkMaintenanceService,
      IDistributedLockService distributedLockService,
      IExecutionStrategyService executionStrategyService,

      IRepositoryBatchedValueContainsWithNavigation<Program> programRepository)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _scheduleJobOptions = scheduleJobOptions.Value ?? throw new ArgumentNullException(nameof(scheduleJobOptions));

      _userService = userService ?? throw new ArgumentNullException(nameof(userService));
      _programService = programService ?? throw new ArgumentNullException(nameof(programService));
      _programStatusService = programStatusService ?? throw new ArgumentNullException(nameof(programStatusService));
      _linkMaintenanceService = linkMaintenanceService ?? throw new ArgumentNullException(nameof(linkMaintenanceService));
      _distributedLockService = distributedLockService ?? throw new ArgumentNullException(nameof(distributedLockService));
      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));

      _programRepository = programRepository ?? throw new ArgumentNullException(nameof(programRepository));
    }
    #endregion

    #region Public Members
    public async Task ProcessProgramHealth()
    {
      const string lockIdentifier = "program_process_health";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        _logger.LogInformation("Processing program health");

        var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsernameSystem, false, false);

        var statusActiveId = _programStatusService.GetByName(ProgramStatus.Active.ToString()).Id;
        var statusUnCompletableId = _programStatusService.GetByName(ProgramStatus.UnCompletable.ToString()).Id;
        var statusExpiredId = _programStatusService.GetByName(ProgramStatus.Expired.ToString()).Id;
        var statusHealthProberIds = Statuses_HealthProbe.Select(o => _programStatusService.GetByName(o.ToString()).Id).ToList();

        while (executeUntil > DateTimeOffset.UtcNow)
        {
          var now = DateTimeOffset.UtcNow;

          var items = _programRepository.Query(true).Where(o => statusHealthProberIds.Contains(o.StatusId)).OrderBy(o => o.DateModified)
            .Take(_scheduleJobOptions.ReferralProgramHealthScheduleBatchSize).ToList();
          if (items.Count == 0) break;

          var itemsToUpdate = new List<Program>();
          var programIdsToExpire = new List<Guid>();

          foreach (var item in items)
          {
            var completable = item.Pathway?.IsCompletable ?? true;

            switch (item.Status)
            {
              case ProgramStatus.Active:
                if (completable) break;

                item.Status = ProgramStatus.UnCompletable;
                item.StatusId = statusUnCompletableId;
                item.ModifiedByUserId = user.Id;
                itemsToUpdate.Add(item);

                break;

              case ProgramStatus.UnCompletable:
                if (completable)
                {
                  //TODO: What if the program ended? 
                  item.Status = ProgramStatus.Active;
                  item.StatusId = statusActiveId;
                  item.ModifiedByUserId = user.Id;
                  itemsToUpdate.Add(item);

                  break;
                }

                if (item.DateModified.AddDays(_scheduleJobOptions.ReferralProgramHealthScheduleGracePeriodInDays) > now) 
                  break;

                item.Status = ProgramStatus.Expired;
                item.StatusId = statusExpiredId;
                item.ModifiedByUserId = user.Id;
                itemsToUpdate.Add(item);
                programIdsToExpire.Add(item.Id);

                break;

              default:
                throw new InvalidOperationException($"Program status of '{item.Status}' not supported for health probing");
            }
          }

          if (itemsToUpdate.Count > 0)
          {
            await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
            {
              using var scope = TransactionScopeHelper.CreateSerializable(TransactionScopeOption.RequiresNew);

              await _programRepository.Update(itemsToUpdate);

              if (programIdsToExpire.Count > 0)
                await _linkMaintenanceService.ExpireByProgramId(programIdsToExpire, _logger);

              scope.Complete();
            });
          }

          if (executeUntil <= DateTimeOffset.UtcNow) break;
        }

        _logger.LogInformation("Processed program health");
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessProgramHealth), ex.Message);
      }
      finally
      {
        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }

    public async Task ProcessExpiration()
    {
      const string lockIdentifier = "program_process_expiration";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        _logger.LogInformation("Processing program expiration");

        var statusExpiredId = _programStatusService.GetByName(ProgramStatus.Expired.ToString()).Id;
        var statusExpirableIds = Statuses_Expirable.Select(o => _programStatusService.GetByName(o.ToString()).Id).ToList();

        var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsernameSystem, false, false);

        while (executeUntil > DateTimeOffset.UtcNow)
        {
          var items = _programRepository.Query().Where(o => statusExpirableIds.Contains(o.StatusId) &&
            o.DateEnd.HasValue && o.DateEnd.Value <= DateTimeOffset.UtcNow).OrderBy(o => o.DateEnd).Take(_scheduleJobOptions.ReferralProgramExpirationScheduleBatchSize).ToList();

          if (items.Count == 0) break;

          items.ForEach(o =>
          {
            o.StatusId = statusExpiredId;
            o.Status = ProgramStatus.Expired;
            o.ModifiedByUserId = user.Id;

            _logger.LogInformation("Program with id '{id}' flagged for expiration", o.Id);
          });

          var programIds = items.Select(o => o.Id).Distinct().ToList();

          await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
          {
            using var scope = TransactionScopeHelper.CreateSerializable(TransactionScopeOption.RequiresNew);

            await _programRepository.Update(items);

            //expires associated links and usages
            await _linkMaintenanceService.ExpireByProgramId(programIds, _logger);

            scope.Complete();
          });

          //TODO: NotificationType.Referral_Expiration_Expired (sent to admin)

          if (executeUntil <= DateTimeOffset.UtcNow) break;
        }

        _logger.LogInformation("Processed program expiration");
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessExpiration), ex.Message);
      }
      finally
      {
        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }

    //TODO [Confirm Requirement]: ProcessExpirationNotifications with NotificationType.Referral_Expiration_WithinNextDays
    //TODO [Confirm Requirement]: ProcessNonCompletableNotifications with NotificationType.Referral_NonCompletable - for active programs only (validated upon implicit activation with ProgressiveBackoffSchedule)

    public async Task ProcessDeletion()
    {
      const string lockIdentifier = "program_process_deletion";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        _logger.LogInformation("Processing program deletion");

        var statusDeletionIds = Statuses_Deletion.Select(o => _programStatusService.GetByName(o.ToString()).Id).ToList();
        var statusDeletedId = _programStatusService.GetByName(ProgramStatus.Deleted.ToString()).Id;

        var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsernameSystem, false, false);

        while (executeUntil > DateTimeOffset.UtcNow)
        {
          //auto-delete inactive and expired programs if not modified for x days
          var items = _programRepository.Query().Where(o => statusDeletionIds.Contains(o.StatusId) &&
              o.DateModified <= DateTimeOffset.UtcNow.AddDays(-_scheduleJobOptions.ReferralProgramDeletionScheduleIntervalInDays))
              .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.ReferralProgramDeletionScheduleBatchSize).ToList();
          if (items.Count == 0) break;

          foreach (var item in items)
          {
            item.StatusId = statusDeletedId;
            item.Status = ProgramStatus.Deleted;
            item.ModifiedByUserId = user.Id;
            _logger.LogInformation("Program with id '{id}' flagged for deletion", item.Id);
          }

          var programIds = items.Select(o => o.Id).Distinct().ToList();

          await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
          {
            using var scope = TransactionScopeHelper.CreateSerializable(TransactionScopeOption.RequiresNew);

            await _programRepository.Update(items);

            //cancel links associated with deleted programs
            await _linkMaintenanceService.CancelByProgramId(programIds, _logger);

            scope.Complete();
          });

          if (executeUntil <= DateTimeOffset.UtcNow) break;
        }

        _logger.LogInformation("Processed program deletion");
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessExpiration), ex.Message);
      }
      finally
      {
        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion
  }
}
