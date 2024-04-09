using Microsoft.Extensions.Caching.Distributed;
using System.Text;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Domain.Core.Services
{
  public class DistributedLockService : IDistributedLockService
  {
    #region Class Variables
    private readonly IDistributedCache _distributedCache;
    #endregion

    #region Constructor
    public DistributedLockService(IDistributedCache distributedCache)
    {
      _distributedCache = distributedCache;
    }
    #endregion

    #region Public Members
    public async Task<bool> TryAcquireLockAsync(string key, TimeSpan lockDuration)
    {
      var value = await _distributedCache.GetAsync(key);
      if (value != null) return false;

      await _distributedCache.SetAsync(key, Encoding.UTF8.GetBytes("locked"), new DistributedCacheEntryOptions
      {
        AbsoluteExpirationRelativeToNow = lockDuration
      });

      return true;
    }

    public async Task ReleaseLockAsync(string key)
    {
      await _distributedCache.RemoveAsync(key);
    }
    #endregion
  }
}
