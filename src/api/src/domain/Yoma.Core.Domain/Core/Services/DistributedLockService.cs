using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using System.Runtime.CompilerServices;
using System.Text;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Domain.Core.Services
{
  public class DistributedLockService : IDistributedLockService
  {
    #region Class Variables
    private readonly ILogger<DistributedLockService> _logger;
    private readonly IConnectionMultiplexer _connectionMultiplexer;

    private const string LockIdentifier_Prefix = "yoma.core.api:locks";
    #endregion

    #region Constructor
    public DistributedLockService(ILogger<DistributedLockService> logger, IConnectionMultiplexer connectionMultiplexer)
    {
      _logger = logger;
      _connectionMultiplexer = connectionMultiplexer;
    }
    #endregion

    #region Public Members
    public async Task<bool> TryAcquireLockAsync(string key, TimeSpan lockDuration, [CallerMemberName] string processName = "Unknown")
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(key, nameof(key));
      key = $"{LockIdentifier_Prefix}:{key.Trim()}";

      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(lockDuration, TimeSpan.Zero, nameof(lockDuration));

      var db = _connectionMultiplexer.GetDatabase();
      bool acquired = await db.StringSetAsync(key, Encoding.UTF8.GetBytes($"locked_by: {System.Environment.MachineName}"), lockDuration, When.NotExists);

      if (acquired)
        _logger.LogInformation("Lock '{lockKey}' acquired by {hostName} at {timestamp} for process '{process}'. Lock duration set to {durationMinutes} minutes",
            key, System.Environment.MachineName, DateTimeOffset.UtcNow, processName, lockDuration.TotalMinutes);
      else
        _logger.LogInformation("Lock '{lockKey}' already held. Skipping execution attempt by {hostName} at {timestamp} for process '{process}'",
            key, System.Environment.MachineName, DateTimeOffset.UtcNow, processName);
 
      return acquired;
    }

    public async Task ReleaseLockAsync(string key, [CallerMemberName] string processName = "Unknown")
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(key, nameof(key));
      key = $"{LockIdentifier_Prefix}:{key.Trim()}";

      var db = _connectionMultiplexer.GetDatabase();
      await db.KeyDeleteAsync(key);

      _logger.LogInformation("Lock '{lockKey}' released by {hostName} at {timestamp} for process '{process}'", key, System.Environment.MachineName, DateTimeOffset.UtcNow, processName);
    }
    #endregion
  }
}
