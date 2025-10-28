using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
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
    private readonly ILogger<ProgramBackgroundService> _logger;
    private readonly ScheduleJobOptions _scheduleJobOptions;

    private readonly ILinkUsageStatusService _linkUsageStatusService;
    private readonly IDistributedLockService _distributedLockService;

    private readonly IRepositoryBatched<ReferralLinkUsage> _linkUsageRepository;

    internal static readonly ReferralLinkUsageStatus[] Statuses_Expirable = [ReferralLinkUsageStatus.Pending];
    #endregion

    #region Constructor
    public LinkUsageBackgroundService(
      ILogger<ProgramBackgroundService> logger,
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
      const string lockIdentifier = "link_usage_process_expiration";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        _logger.LogInformation("Processing link usage expiration");

        //link usage completion windows elapsed based on program level completion window in-days

        _logger.LogInformation("Processed link usage expiration");
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
