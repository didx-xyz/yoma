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
    private readonly IProgramStatusService _programStatusService;
    private readonly ILinkMaintenanceService _linkMaintenanceService;
    private readonly IDistributedLockService _distributedLockService;
    private readonly IExecutionStrategyService _executionStrategyService;

    private readonly IRepositoryBatchedValueContainsWithNavigation<Program> _programRepository;

    internal static readonly ProgramStatus[] Statuses_Expirable = [ProgramStatus.Active];
    internal static readonly ProgramStatus[] Statuses_Deletion = [ProgramStatus.Inactive, ProgramStatus.Expired];
    #endregion

    #region Constructor
    public ProgramBackgroundService(
      ILogger<ProgramBackgroundService> logger,
      IOptions<ScheduleJobOptions> scheduleJobOptions,

      IUserService userService,
      IProgramStatusService programStatusService,
      ILinkMaintenanceService linkMaintenanceService,
      IDistributedLockService distributedLockService,
      IExecutionStrategyService executionStrategyService,

      IRepositoryBatchedValueContainsWithNavigation<Program> programRepository)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _scheduleJobOptions = scheduleJobOptions.Value ?? throw new ArgumentNullException(nameof(scheduleJobOptions));

      _userService = userService ?? throw new ArgumentNullException(nameof(userService));
      _programStatusService = programStatusService ?? throw new ArgumentNullException(nameof(programStatusService));
      _linkMaintenanceService = linkMaintenanceService ?? throw new ArgumentNullException(nameof(linkMaintenanceService));
      _distributedLockService = distributedLockService ?? throw new ArgumentNullException(nameof(distributedLockService));
      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));

      _programRepository = programRepository ?? throw new ArgumentNullException(nameof(programRepository));
    }
    #endregion

    #region Public Members
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
            using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

            await _programRepository.Update(items);

            //expires associated links and usages
            await _linkMaintenanceService.ExpireByProgramId(programIds, _logger);

            scope.Complete();
          });

          //TODO: Notification: Referral_Expiration_Expired: sent to admin; use itemsExpired

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

        _logger.LogInformation("Processing program expiration");

        //auto-delete inactive and expired programs if not modified for x days (inactive excluded from auto-deletion)

        //cancel links associated with deleted programs

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
    #endregion
  }
}
