using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Treasury.Interfaces;

namespace Yoma.Core.Domain.Treasury.Services
{
  public sealed class TreasuryBackgroundService : ITreasuryBackgroundService
  {
    #region Class Variables
    private readonly ILogger<TreasuryBackgroundService> _logger;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly ITreasuryService _treasuryService;
    private readonly IDistributedLockService _distributedLockService;
    #endregion

    #region Constructor
    public TreasuryBackgroundService(ILogger<TreasuryBackgroundService> logger,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        ITreasuryService treasuryService,
        IDistributedLockService distributedLockService)
    {
      _logger = logger;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _treasuryService = treasuryService;
      _distributedLockService = distributedLockService;
    }
    #endregion

    #region Public Members
    public async Task ProcessFinancialYearRollover()
    {
      const string lockIdentifier = "treasury_process_financial_year_rollover";
      var lockDuration = TimeSpan.FromHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours) + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processing treasury financial-year rollover");

        var rolloverProcessed = await _treasuryService.ProcessFinancialYearRollover();

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processed treasury financial-year rollover. Rollover processed: {rolloverProcessed}", rolloverProcessed);
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessFinancialYearRollover), ex.Message);
      }
      finally
      {
        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion
  }
}
