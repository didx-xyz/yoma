using StackExchange.Redis;
using System.Text;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Domain.Core.Services
{
  public class DistributedLockService : IDistributedLockService
  {
    #region Class Variables
    private readonly IConnectionMultiplexer _connectionMultiplexer;
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
      var db = _connectionMultiplexer.GetDatabase();
      // Use SET command with NX (Only set the key if it does not already exist) and PX (expire time in milliseconds) options.
      // This is an atomic operation in Redis.
      bool acquired = await db.StringSetAsync(key, Encoding.UTF8.GetBytes("locked"), lockDuration, When.NotExists);

      return acquired;
    }

    public async Task ReleaseLockAsync(string key)
    {
      var db = _connectionMultiplexer.GetDatabase();
      await db.KeyDeleteAsync(key);
    }
    #endregion
  }
}
