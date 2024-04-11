using StackExchange.Redis;
using System.Text;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Domain.Core.Services
{
  public class DistributedLockService : IDistributedLockService
  {
    #region Class Variables
    private readonly IConnectionMultiplexer _connectionMultiplexer;

    private const string LockIdentifier_Prefix = "yoma.core.api:locks";
    #endregion

    #region Constructor
    public DistributedLockService(IConnectionMultiplexer connectionMultiplexer)
    {
      _connectionMultiplexer = connectionMultiplexer;
    }
    #endregion

    #region Public Members
    public async Task<bool> TryAcquireLockAsync(string key, TimeSpan lockDuration)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(key, nameof(key));
      key = $"{LockIdentifier_Prefix}:{key.Trim()}";

      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(lockDuration, TimeSpan.Zero, nameof(lockDuration));

      if (lockDuration <= TimeSpan.Zero)
        throw new ArgumentOutOfRangeException(nameof(lockDuration), "Lock duration must be greater than zero");

      var db = _connectionMultiplexer.GetDatabase();
      bool acquired = await db.StringSetAsync(key, Encoding.UTF8.GetBytes($"locked_by: {System.Environment.MachineName}"), lockDuration, When.NotExists);

      return acquired;
    }

    public async Task ReleaseLockAsync(string key)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(key, nameof(key));
      key = $"{LockIdentifier_Prefix}:{key.Trim()}";

      var db = _connectionMultiplexer.GetDatabase();
      await db.KeyDeleteAsync(key);
    }
    #endregion
  }
}
