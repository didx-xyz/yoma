using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Transactions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.IdentityProvider.Extensions;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Notification;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Notification.Models;
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

    private readonly IIdentityProviderClient _identityProviderClient;

    private readonly IUserService _userService;
    private readonly IProgramStatusService _programStatusService;
    private readonly ILinkMaintenanceService _linkMaintenanceService;
    private readonly IDistributedLockService _distributedLockService;
    private readonly IExecutionStrategyService _executionStrategyService;
    private readonly INotificationDeliveryService _notificationDeliveryService;
    private readonly INotificationURLFactory _notificationURLFactory;

    private readonly IRepositoryBatchedValueContainsWithNavigation<Program> _programRepository;

    internal static readonly ProgramStatus[] Statuses_Expirable = [ProgramStatus.Active, ProgramStatus.UnCompletable];
    internal static readonly ProgramStatus[] Statuses_Deletion = [ProgramStatus.Inactive];
    internal static readonly ProgramStatus[] Statuses_HealthProbe = [ProgramStatus.Active, ProgramStatus.UnCompletable];
    #endregion

    #region Constructor
    public ProgramBackgroundService(
      ILogger<ProgramBackgroundService> logger,
      IOptions<ScheduleJobOptions> scheduleJobOptions,

      IIdentityProviderClientFactory identityProviderClientFactory,

      IUserService userService,
      IProgramStatusService programStatusService,
      ILinkMaintenanceService linkMaintenanceService,
      IDistributedLockService distributedLockService,
      IExecutionStrategyService executionStrategyService,
      INotificationDeliveryService notificationDeliveryService,
      INotificationURLFactory notificationURLFactory,

      IRepositoryBatchedValueContainsWithNavigation<Program> programRepository)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _scheduleJobOptions = scheduleJobOptions.Value ?? throw new ArgumentNullException(nameof(scheduleJobOptions));

      _identityProviderClient = identityProviderClientFactory.CreateClient() ?? throw new ArgumentNullException(nameof(identityProviderClientFactory));

      _userService = userService ?? throw new ArgumentNullException(nameof(userService));
      _programStatusService = programStatusService ?? throw new ArgumentNullException(nameof(programStatusService));
      _linkMaintenanceService = linkMaintenanceService ?? throw new ArgumentNullException(nameof(linkMaintenanceService));
      _distributedLockService = distributedLockService ?? throw new ArgumentNullException(nameof(distributedLockService));
      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));
      _notificationDeliveryService = notificationDeliveryService ?? throw new ArgumentNullException(nameof(notificationDeliveryService));
      _notificationURLFactory = notificationURLFactory ?? throw new ArgumentNullException(nameof(notificationURLFactory));

      _programRepository = programRepository ?? throw new ArgumentNullException(nameof(programRepository));
    }
    #endregion

    #region Public Members
    public async Task ProcessProgramHealth()
    {
      const string lockIdentifier = "referral_program_process_health";
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
        var statusLimitReachedId = _programStatusService.GetByName(ProgramStatus.LimitReached.ToString()).Id;
        var statusHealthProbeIds = Statuses_HealthProbe.Select(o => _programStatusService.GetByName(o.ToString()).Id).ToList();

        var processedProgramIds = new HashSet<Guid>();

        while (executeUntil > DateTimeOffset.UtcNow)
        {
          var now = DateTimeOffset.UtcNow;

          var items = _programRepository.Query(true).Where(o => !processedProgramIds.Contains(o.Id) && statusHealthProbeIds.Contains(o.StatusId)).OrderBy(o => o.DateModified)
            .Take(_scheduleJobOptions.ReferralProgramHealthScheduleBatchSize).ToList();
          if (items.Count == 0) break;

          var itemsToUpdate = new List<Program>();
          var programIdsToExpire = new List<Guid>();
          var programIdsToLimitReached = new List<Guid>();
          var unCompletableProgramsForNotification = new List<Program>();

          foreach (var item in items)
          {
            processedProgramIds.Add(item.Id);

            var completable = item.Pathway?.IsCompletable ?? true;

            switch (item.Status)
            {
              case ProgramStatus.Active:
                if (completable) break;

                item.Status = ProgramStatus.UnCompletable;
                item.StatusId = statusUnCompletableId;
                item.ModifiedByUserId = user.Id;
                itemsToUpdate.Add(item);

                _logger.LogInformation("Program '{ProgramName}' ({ProgramId}) marked UnCompletable — broken pathway detected", item.Name, item.Id);

                break;

              case ProgramStatus.UnCompletable:
                if (completable)
                {
                  if (item.DateEnd.HasValue && item.DateEnd.Value <= now)
                  {
                    item.Status = ProgramStatus.Expired;
                    item.StatusId = statusExpiredId;
                    item.ModifiedByUserId = user.Id;
                    itemsToUpdate.Add(item);
                    programIdsToExpire.Add(item.Id);

                    _logger.LogInformation("Program '{ProgramName}' ({ProgramId}) expired instead of reactivation — end date reached {DateEnd:yyyy-MM-dd}", item.Name, item.Id, item.DateEnd);

                    break;
                  }

                  if (item.CompletionLimit.HasValue && (item.CompletionTotal ?? 0) >= item.CompletionLimit.Value)
                  {
                    item.Status = ProgramStatus.LimitReached;
                    item.StatusId = statusLimitReachedId;
                    item.ModifiedByUserId = user.Id;
                    itemsToUpdate.Add(item);
                    programIdsToLimitReached.Add(item.Id);

                    _logger.LogInformation("Program '{ProgramName}' ({ProgramId}) set to LIMIT_REACHED instead of reactivation — cap hit (total {Total} >= limit {Limit})",
                      item.Name, item.Id, item.CompletionTotal ?? 0, item.CompletionLimit.Value);

                    break;
                  }

                  item.Status = ProgramStatus.Active;
                  item.StatusId = statusActiveId;
                  item.ModifiedByUserId = user.Id;
                  itemsToUpdate.Add(item);

                  _logger.LogInformation("Program '{ProgramName}' ({ProgramId}) reactivated — pathway now completable", item.Name, item.Id);

                  break;
                }

                // Still UnCompletable and pathway still broken
                var expiryDate = GetUnCompletableExpiryDate(item);

                // Beyond grace → Expired
                if (expiryDate <= now)
                {
                  item.Status = ProgramStatus.Expired;
                  item.StatusId = statusExpiredId;
                  item.ModifiedByUserId = user.Id;
                  itemsToUpdate.Add(item);
                  programIdsToExpire.Add(item.Id);

                  _logger.LogInformation(
                    "Program '{ProgramName}' ({ProgramId}) expired — un-completable beyond grace period (modified {DateModified:yyyy-MM-dd})",
                    item.Name, item.Id, item.DateModified);

                  break;
                }

                // Already UnCompletable for a while, and expiring within X days
                if (IsInUnCompletableWarningWindow(item, now)) unCompletableProgramsForNotification.Add(item);

                break;

              default:
                throw new InvalidOperationException($"Program status of '{item.Status}' not supported for health probing");
            }
          }

          if (itemsToUpdate.Count > 0)
          {
            await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
            {
              using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

              itemsToUpdate = await _programRepository.Update(itemsToUpdate);

              if (programIdsToExpire.Count > 0)
              {
                _logger.LogInformation("Expiring {Count} program(s) due to health probe or end date", programIdsToExpire.Count);
                await _linkMaintenanceService.ExpireByProgramId(programIdsToExpire, _logger);
              }

              if (programIdsToLimitReached.Count > 0)
              {
                _logger.LogInformation("Flipping {Count} program(s) to limit reached due to hitting cap", programIdsToLimitReached.Count);
                await _linkMaintenanceService.LimitReachedByProgramId(programIdsToLimitReached, _logger);
              }

              scope.Complete();
            });
          }

          var expiredPrograms = itemsToUpdate.Where(o => o.Status == ProgramStatus.Expired).ToList();
          if (expiredPrograms.Count > 0) await SendNotification(NotificationType.ReferralProgram_Expiration_Expired, expiredPrograms);

          var unCompletablePrograms = itemsToUpdate.Where(o => o.Status == ProgramStatus.UnCompletable).Concat(unCompletableProgramsForNotification).DistinctBy(o => o.Id).ToList();
          if (unCompletablePrograms.Count > 0) await SendNotification(NotificationType.ReferralProgram_UnCompletable, unCompletablePrograms);

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
      const string lockIdentifier = "referral_program_process_expiration";
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
          var now = DateTimeOffset.UtcNow;

          var items = _programRepository.Query().Where(o => statusExpirableIds.Contains(o.StatusId) &&
            o.DateEnd.HasValue && o.DateEnd.Value <= now).OrderBy(o => o.DateEnd).Take(_scheduleJobOptions.ReferralProgramExpirationScheduleBatchSize).ToList();

          if (items.Count == 0) break;

          items.ForEach(o =>
          {
            o.StatusId = statusExpiredId;
            o.Status = ProgramStatus.Expired;
            o.ModifiedByUserId = user.Id;

            _logger.LogInformation("Program with id '{ProgramId}' flagged for expiration — end date {DateEnd:yyyy-MM-dd}", o.Id, o.DateEnd!);
          });

          var programIds = items.Select(o => o.Id).Distinct().ToList();

          await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
          {
            using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

            items = await _programRepository.Update(items);

            //expires associated links and usages
            await _linkMaintenanceService.ExpireByProgramId(programIds, _logger);

            scope.Complete();
          });

          await SendNotification(NotificationType.ReferralProgram_Expiration_Expired, items);

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

    public async Task ProcessExpirationNotifications()
    {
      const string lockIdentifier = "referral_program_process_expiration_notifications";
      var lockDuration = TimeSpan.FromHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours) + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        _logger.LogInformation("Processing program expiration notifications");

        var datetimeFrom = DateTimeOffset.UtcNow;
        var datetimeTo = datetimeFrom.AddDays(_scheduleJobOptions.ReferralProgramExpirationNotificationIntervalInDays);
        var statusExpirableIds = Statuses_Expirable.Select(o => _programStatusService.GetByName(o.ToString()).Id).ToList();

        var items = _programRepository.Query().Where(o => statusExpirableIds.Contains(o.StatusId) &&
            o.DateEnd.HasValue && o.DateEnd.Value >= datetimeFrom && o.DateEnd.Value <= datetimeTo)
            .OrderBy(o => o.DateEnd).Take(_scheduleJobOptions.ReferralProgramExpirationScheduleBatchSize).ToList();
        if (items.Count == 0) return;

        await SendNotification(NotificationType.ReferralProgram_Expiration_WithinNextDays, items);

        _logger.LogInformation("Processed program expiration notifications");
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessExpirationNotifications), ex.Message);
      }
      finally
      {
        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }

    public async Task ProcessDeletion()
    {
      const string lockIdentifier = "referral_program_process_deletion";
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
          var now = DateTimeOffset.UtcNow;

          //auto-delete eligible programs if not modified for x days
          var items = _programRepository.Query().Where(o => statusDeletionIds.Contains(o.StatusId) &&
              o.DateModified <= now.AddDays(-_scheduleJobOptions.ReferralProgramDeletionScheduleIntervalInDays))
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
            using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

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
        _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessDeletion), ex.Message);
      }
      finally
      {
        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion

    #region Private Members
    private DateTimeOffset GetUnCompletableExpiryDate(Program item) => item.DateModified.AddDays(_scheduleJobOptions.ReferralProgramHealthScheduleExpirationGracePeriodInDays);

    private bool IsInUnCompletableWarningWindow(Program item, DateTimeOffset now)
    {
      var expiryDate = GetUnCompletableExpiryDate(item);
      var warnWindowStart = expiryDate.AddDays(-_scheduleJobOptions.ReferralProgramHealthScheduleExpirationNotificationInDays);
      return now >= warnWindowStart && now < expiryDate;
    }

    private async Task SendNotification(NotificationType type, List<Program> items)
    {
      try
      {
        var superAdmins = await _identityProviderClient.ListByRole(Core.Constants.Role_Admin);
        var recipients = superAdmins?.Select(o => new NotificationRecipient
        {
          Username = o.Username,
          PhoneNumber = o.PhoneNumber,
          PhoneNumberConfirmed = o.PhoneNumberVerified,
          Email = o.Email,
          EmailConfirmed = o.EmailVerified,
          DisplayName = o.ToDisplayName()
        }).ToList();

        if (recipients == null || recipients.Count == 0)
        {
          _logger.LogWarning("No super admin users found to send notification of type '{NotificationType}'", type);
          return;
        }

        switch (type)
        {
          case NotificationType.ReferralProgram_Expiration_Expired:
          case NotificationType.ReferralProgram_Expiration_WithinNextDays:
            var dataExpiration = new NotificationReferralProgramExpiration
            {
              WithinNextDays = _scheduleJobOptions.ReferralProgramExpirationNotificationIntervalInDays,
              Programs = [.. items.Select(o => new NotificationReferralProgramExpirationItem
              {
                Name = o.Name,
                DateStart = o.DateStart,
                DateEnd = o.DateEnd,
                URL = _notificationURLFactory.ReferralProgramItemURL(type, o.Id)
              })]
            };

            await _notificationDeliveryService.Send(type, recipients, dataExpiration);

            break;

          case NotificationType.ReferralProgram_UnCompletable:
            var today = DateTimeOffset.UtcNow.Date;

            // Just became Un-Completable today → immediate notification with full grace period
            var itemsToday = items
              .Where(o => o.DateModified.Date == today)
              .ToList();

            // Already Un-Completable before today → use the notification window
            var itemsOlder = items
              .Where(o => o.DateModified.Date < today)
              .ToList();

            var recipientDataGroups = new List<(List<NotificationRecipient> Recipients, NotificationReferralProgramUnCompletable Data)>();

            if (itemsToday.Count > 0)
            {
              var dataToday = new NotificationReferralProgramUnCompletable
              {
                WithinNextDays = _scheduleJobOptions.ReferralProgramHealthScheduleExpirationGracePeriodInDays,
                Programs = [.. itemsToday.Select(o => new NotificationReferralProgramUnCompletableItem
                {
                  Name = o.Name,
                  DateUnCompletable = o.DateModified,
                  DateStart = o.DateStart,
                  DateEnd = o.DateEnd,
                  DateUncompletableAutoExpiry = GetUnCompletableExpiryDate(o),
                  URL = _notificationURLFactory.ReferralProgramItemURL(type, o.Id)
                })]
              };

              recipientDataGroups.Add((recipients, dataToday));
            }

            if (itemsOlder.Count > 0)
            {
              var dataOlder = new NotificationReferralProgramUnCompletable
              {
                WithinNextDays = _scheduleJobOptions.ReferralProgramHealthScheduleExpirationNotificationInDays,
                Programs = [.. itemsOlder.Select(o => new NotificationReferralProgramUnCompletableItem
                {
                  Name = o.Name,
                  DateUnCompletable = o.DateModified,
                  DateStart = o.DateStart,
                  DateEnd = o.DateEnd,
                  DateUncompletableAutoExpiry = GetUnCompletableExpiryDate(o),
                  URL = _notificationURLFactory.ReferralProgramItemURL(type, o.Id)
                })]
              };

              recipientDataGroups.Add((recipients, dataOlder));
            }

            if (recipientDataGroups.Count > 0)
              await _notificationDeliveryService.Send(type, recipientDataGroups);

            break;

          default:
            throw new ArgumentOutOfRangeException(nameof(type), $"Type of '{type}' not supported");
        }

        _logger.LogInformation("Successfully sent notification");
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to send notification: {errorMessage}", ex.Message);
      }
    }
    #endregion
  }
}
