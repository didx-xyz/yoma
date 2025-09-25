using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using System.Runtime.CompilerServices;
using System.Text;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Services
{
  public class DistributedLockService : IDistributedLockService
  {
    #region Class Variables
    private readonly ILogger<DistributedLockService> _logger;
    private readonly AppSettings _appSettings;
    private readonly IConnectionMultiplexer _connectionMultiplexer;

    private const string LockIdentifier_Prefix = "yoma.core.api:locks";
    #endregion

    #region Constructor
    public DistributedLockService(ILogger<DistributedLockService> logger, IOptions<AppSettings> appSettings, IConnectionMultiplexer connectionMultiplexer)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _appSettings = appSettings.Value ?? throw new ArgumentNullException(nameof(appSettings));
      _connectionMultiplexer = connectionMultiplexer ?? throw new ArgumentNullException(nameof(connectionMultiplexer));
    }
    #endregion

    #region Public Members
    public async Task<bool> TryAcquireLockAsync(string key, TimeSpan lockDuration, [CallerMemberName] string processName = "Unknown")
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(key, nameof(key));
      key = key.Trim();

      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(lockDuration, TimeSpan.Zero, nameof(lockDuration));

      var redisKey = $"{LockIdentifier_Prefix}:{key}";
      var db = _connectionMultiplexer.GetDatabase();
      bool acquired = await db.StringSetAsync(redisKey, Encoding.UTF8.GetBytes($"locked_by: {System.Environment.MachineName}"), lockDuration, When.NotExists);

      if (acquired)
        _logger.LogInformation("Lock '{lockKey}' acquired by {hostName} at {timestamp} for process '{process}'. Lock duration set to {durationMinutes} minutes",
            redisKey, System.Environment.MachineName, DateTimeOffset.UtcNow, processName, lockDuration.TotalMinutes);
      else
        _logger.LogInformation("Lock '{lockKey}' already held. Skipping execution attempt by {hostName} at {timestamp} for process '{process}'",
            redisKey, System.Environment.MachineName, DateTimeOffset.UtcNow, processName);

      return acquired;
    }

    public async Task ReleaseLockAsync(string key, [CallerMemberName] string processName = "Unknown")
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(key, nameof(key));
      key = key.Trim();

      var redisKey = $"{LockIdentifier_Prefix}:{key}";
      var db = _connectionMultiplexer.GetDatabase();

      try
      {
        await db.KeyDeleteAsync(redisKey);

        _logger.LogInformation("Lock '{lockKey}' released by {hostName} at {timestamp} for process '{process}'",
          redisKey, System.Environment.MachineName, DateTimeOffset.UtcNow, processName);
      }
      catch (Exception ex)
      {
        // Swallow to avoid masking upstream exceptions; log for observability.
        _logger.LogWarning(ex, "Failed to release lock '{lockKey}' by {hostName} at {timestamp} for process '{process}'. Proceeding",
          redisKey, System.Environment.MachineName, DateTimeOffset.UtcNow, processName);
      }
    }

    public async Task RunWithLockAsync(string key, TimeSpan lockDuration, Func<Task> action, [CallerMemberName] string processName = "Unknown")
    {
      await RunWithLockCoreAsync(key, lockDuration, async () => { await action(); return true; }, processName);
    }

    public async Task<T> RunWithLockAsync<T>(string key, TimeSpan lockDuration, Func<Task<T>> action, [CallerMemberName] string processName = "Unknown")
    {
      return await RunWithLockCoreAsync(key, lockDuration, action, processName);
    }
    #endregion

    #region Private Members
    private async Task<T> RunWithLockCoreAsync<T>(string key, TimeSpan lockDuration, Func<Task<T>> action, string processName)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(key);
      key = key.Trim();

      ArgumentNullException.ThrowIfNull(action);
      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(lockDuration, TimeSpan.Zero, nameof(lockDuration));

      if (_appSettings.DistributedLockRetryDelayInMilliseconds <= 0)
        throw new InvalidOperationException($"{nameof(AppSettings)}:{nameof(_appSettings.DistributedLockRetryDelayInMilliseconds)} must be greater than zero.");

      var retryDelay = TimeSpan.FromMilliseconds(_appSettings.DistributedLockRetryDelayInMilliseconds);
      var acquireBudget = lockDuration * 2;
      var acquireDeadline = DateTimeOffset.UtcNow + acquireBudget;

      var acquired = false;

      while (!(acquired = await TryAcquireLockAsync(key, lockDuration, processName)))
      {
        if (DateTimeOffset.UtcNow >= acquireDeadline)
          throw new TimeoutException($"Could not acquire distributed lock '{key}' within {acquireBudget}.");

        await Task.Delay(retryDelay);
      }

      try
      {
        return await action();
      }
      finally
      {
        if (acquired)
          await ReleaseLockAsync(key, processName);
      }
    }
    #endregion
  }
}
