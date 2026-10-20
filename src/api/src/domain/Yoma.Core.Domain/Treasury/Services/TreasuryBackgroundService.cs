using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Helpers;
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
    private readonly IHostApplicationLifetime _applicationLifetime;
    #endregion

    #region Constructor
    public TreasuryBackgroundService(ILogger<TreasuryBackgroundService> logger,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        ITreasuryService treasuryService,
        IDistributedLockService distributedLockService,
        IHostApplicationLifetime applicationLifetime)
    {
      _logger = logger;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _treasuryService = treasuryService;
      _distributedLockService = distributedLockService;
      _applicationLifetime = applicationLifetime ?? throw new ArgumentNullException(nameof(applicationLifetime));
    }
    #endregion

    #region Public Members
    public async Task ProcessFinancialYearRollover()
    {
      const string lockIdentifier = "treasury_process_financial_year_rollover";
      var lockDuration = TimeSpan.FromHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours) + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      await using var job = BackgroundJobExecutionScope.CreateWithLock(_applicationLifetime, _distributedLockService, _logger);

      try
      {
        if (!await job.TryAcquireLockAsync(lockIdentifier, lockDuration)) return;

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processing treasury financial-year rollover");

        var rolloverProcessed = await _treasuryService.ProcessFinancialYearRollover();

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processed treasury financial-year rollover. Rollover processed: {rolloverProcessed}", rolloverProcessed);
      }
      catch (Exception ex)
      {
        job.ThrowIfStopping(ex);

        if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessFinancialYearRollover), ex.Message);
      }
    }
    #endregion
  }
}
