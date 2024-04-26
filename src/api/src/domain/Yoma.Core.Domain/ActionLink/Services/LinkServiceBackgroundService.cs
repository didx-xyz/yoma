using Hangfire;
using Hangfire.Storage;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.ActionLink.Interfaces;
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
    private readonly IRepositoryBatched<Link> _linkRepository;
    private readonly IDistributedLockService _distributedLockService;

    private static readonly LinkStatus[] Statuses_Expirable = [LinkStatus.Active];
    #endregion

    #region Constructor
    public LinkServiceBackgroundService(ILogger<LinkServiceBackgroundService> logger,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        ILinkStatusService linkStatusService,
        IUserService userService,
        IRepositoryBatched<Link> linkRepository,
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

      if (!await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration))
      {
        _logger.LogInformation("{Process} is already running. Skipping execution attempt at {dateStamp}", nameof(ProcessExpiration), DateTimeOffset.UtcNow);
        return;
      }


      try
      {
        using (JobStorage.Current.GetConnection().AcquireDistributedLock(lockIdentifier, lockDuration))
        {
          _logger.LogInformation("Lock '{lockIdentifier}' acquired by {hostName} at {dateStamp}. Lock duration set to {lockDurationInMinutes} minutes",
            lockIdentifier, Environment.MachineName, DateTimeOffset.UtcNow, lockDuration.TotalMinutes);

          _logger.LogInformation("Processing action link expiration");
        }

        var statusExpiredId = _linkStatusService.GetByName(LinkStatus.Expired.ToString()).Id;
        var statusExpirableIds = Statuses_Expirable.Select(o => _linkStatusService.GetByName(o.ToString()).Id).ToList();

        while (executeUntil > DateTimeOffset.UtcNow)
        {
          var items = _linkRepository.Query().Where(o => statusExpirableIds.Contains(o.StatusId) &&
              o.DateEnd.HasValue && o.DateEnd.Value <= DateTimeOffset.UtcNow).OrderBy(o => o.DateEnd).Take(_scheduleJobOptions.ActionLinkExpirationBatchSize).ToList();
          if (items.Count == 0) break;

          var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsernameSystem, false, false);

          foreach (var item in items)
          {
            item.StatusId = statusExpiredId;
            item.ModifiedByUserId = user.Id;
            _logger.LogInformation("Action link with id '{id}' flagged for expiration", item.Id);
          }

          items = await _linkRepository.Update(items);

          if (executeUntil <= DateTimeOffset.UtcNow) break;
        }

        _logger.LogInformation("Processed action link expiration");
      }
      catch (DistributedLockTimeoutException ex)
      {
        _logger.LogError(ex, "Could not acquire distributed lock for {process}", nameof(ProcessExpiration));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}", nameof(ProcessExpiration));
      }
      finally
      {
        await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion
  }
}
