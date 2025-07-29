using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.ActionLink.Interfaces;
using Yoma.Core.Domain.ActionLink.Interfaces.Lookups;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;

namespace Yoma.Core.Domain.ActionLink.Services
{
  public class LinkServiceBackgroundService : ILinkServiceBackgroundService
  {
    #region Class Variables
    private readonly ILogger<LinkServiceBackgroundService> _logger;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly ILinkStatusService _linkStatusService;
    private readonly IUserService _userService;
    private readonly IRepositoryBatchedValueContains<Link> _linkRepository;
    private readonly IDistributedLockService _distributedLockService;

    internal static readonly LinkStatus[] Statuses_Expirable = [LinkStatus.Active];
    internal static readonly LinkStatus[] Statuses_Deletion = [LinkStatus.Inactive];
    #endregion

    #region Constructor
    public LinkServiceBackgroundService(ILogger<LinkServiceBackgroundService> logger,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        ILinkStatusService linkStatusService,
        IUserService userService,
        IRepositoryBatchedValueContains<Link> linkRepository,
        IDistributedLockService distributedLockService)
    {
      _logger = logger;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _linkStatusService = linkStatusService;
      _userService = userService;
      _linkRepository = linkRepository;
      _distributedLockService = distributedLockService;
    }
    #endregion

    #region Public Members
    public async Task ProcessExpiration()
    {
      const string lockIdentifier = "action_link_process_expiration";

      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        _logger.LogInformation("Processing action link expiration");

        var statusExpiredId = _linkStatusService.GetByName(LinkStatus.Expired.ToString()).Id;
        var statusExpirableIds = Statuses_Expirable.Select(o => _linkStatusService.GetByName(o.ToString()).Id).ToList();

        while (executeUntil > DateTimeOffset.UtcNow)
        {
          var items = _linkRepository.Query().Where(o => statusExpirableIds.Contains(o.StatusId) &&
              o.DateEnd.HasValue && o.DateEnd.Value <= DateTimeOffset.UtcNow).OrderBy(o => o.DateEnd).Take(_scheduleJobOptions.ActionLinkExpirationScheduleBatchSize).ToList();
          if (items.Count == 0) break;

          var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsernameSystem, false, false);

          foreach (var item in items)
          {
            item.StatusId = statusExpiredId;
            item.Status = LinkStatus.Expired;
            item.ModifiedByUserId = user.Id;
            _logger.LogInformation("Action link with id '{id}' flagged for expiration", item.Id);
          }

          items = await _linkRepository.Update(items);

          if (executeUntil <= DateTimeOffset.UtcNow) break;
        }

        _logger.LogInformation("Processed action link expiration");
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
      const string lockIdentifier = "action_link_process_deletion";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        var statusDeletionIds = Statuses_Deletion.Select(o => _linkStatusService.GetByName(o.ToString()).Id).ToList();
        var statusDeletedId = _linkStatusService.GetByName(LinkStatus.Deleted.ToString()).Id;

        _logger.LogInformation("Processing action link deletion");

        while (executeUntil > DateTimeOffset.UtcNow)
        {
          var items = _linkRepository.Query().Where(o => statusDeletionIds.Contains(o.StatusId) &&
              o.DateModified <= DateTimeOffset.UtcNow.AddDays(-_scheduleJobOptions.ActionLinkDeletionScheduleIntervalInDays))
              .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.ActionLinkDeletionScheduleBatchSize).ToList();
          if (items.Count == 0) break;

          var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsernameSystem, false, false);

          foreach (var item in items)
          {
            item.StatusId = statusDeletedId;
            item.Status = LinkStatus.Deleted;
            item.ModifiedByUserId = user.Id;
            _logger.LogInformation("Action link with id '{id}' flagged for deletion", item.Id);
          }

          await _linkRepository.Update(items);

          if (executeUntil <= DateTimeOffset.UtcNow) break;
        }

        _logger.LogInformation("Processed action link deletion");
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
  }
}
