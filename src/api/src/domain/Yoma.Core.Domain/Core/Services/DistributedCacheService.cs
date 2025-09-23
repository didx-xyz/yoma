using Newtonsoft.Json;
using StackExchange.Redis;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Domain.Core.Services
{
  public class DistributedCacheService : IDistributedCacheService
  {
    #region Class Variables
    private readonly IDatabase _database;
    private const string CacheIdentifier_Prefix = "yoma.core.api:cache";
    #endregion

    #region Constructor
    public DistributedCacheService(IConnectionMultiplexer connectionMultiplexer)
    {
      _database = connectionMultiplexer.GetDatabase();
    }
    #endregion

    #region Public Members
    public T GetOrCreate<T>(string key, Func<T> valueProvider, TimeSpan? slidingExpiration = null, TimeSpan? absoluteExpirationRelativeToNow = null)
      where T : class
    {
      return GetOrCreateInternalAsync(key, () => Task.FromResult(valueProvider()), slidingExpiration, absoluteExpirationRelativeToNow).GetAwaiter().GetResult();
    }

    public async Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> valueProvider, TimeSpan? slidingExpiration = null, TimeSpan? absoluteExpirationRelativeToNow = null)
      where T : class
    {
      return await GetOrCreateInternalAsync(key, valueProvider, slidingExpiration, absoluteExpirationRelativeToNow);
    }

    public void Remove(string key)
    {
      RemoveInternalAsync(key).GetAwaiter().GetResult();
    }

    public async Task RemoveAsync(string key)
    {
      await RemoveInternalAsync(key);
    }
    #endregion

    #region Private Members
    private async Task<T> GetOrCreateInternalAsync<T>(string key, Func<Task<T>> valueProvider, TimeSpan? slidingExpiration = null, TimeSpan? absoluteExpirationRelativeToNow = null)
      where T : class
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(key, nameof(key));
      key = key.Trim();

      ArgumentNullException.ThrowIfNull(valueProvider, nameof(valueProvider));

      if (slidingExpiration.HasValue && absoluteExpirationRelativeToNow.HasValue && slidingExpiration > absoluteExpirationRelativeToNow)
        throw new InvalidOperationException("'Sliding Expiration' cannot be longer than 'Absolute Expiration Relative to Now'");

      var redisKey = $"{CacheIdentifier_Prefix}:{key}";
      var redisValueWithExpiry = await _database.StringGetWithExpiryAsync(redisKey);

      if (redisValueWithExpiry.Value.HasValue)
      {
        var cachedValue = JsonConvert.DeserializeObject<T>(redisValueWithExpiry.Value!)
            ?? throw new InvalidOperationException($"Failed to deserialize value for key '{redisKey}'");

        if (slidingExpiration.HasValue && redisValueWithExpiry.Expiry.HasValue)
        {
          // If caller provided an absolute cap, don't exceed the remaining TTL (cap).
          // If not, reset to sliding to truly "slide" the expiration window.
          var newExpiration =
            absoluteExpirationRelativeToNow.HasValue
              ? (slidingExpiration.Value < redisValueWithExpiry.Expiry.Value
                  ? slidingExpiration.Value
                  : redisValueWithExpiry.Expiry.Value)
              : slidingExpiration.Value;

          await _database.KeyExpireAsync(redisKey, newExpiration);
        }

        return cachedValue;
      }

      var value = await valueProvider() ?? throw new InvalidOperationException($"Value provider returned null for key '{redisKey}'");
      var serializedValue = JsonConvert.SerializeObject(value);
      var expiration = absoluteExpirationRelativeToNow ?? slidingExpiration;

      await _database.StringSetAsync(redisKey, serializedValue, expiration);

      return value;
    }

    private async Task RemoveInternalAsync(string key)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(key, nameof(key));
      key = key.Trim();

      var redisKey = $"{CacheIdentifier_Prefix}:{key}";

      await _database.KeyDeleteAsync(redisKey);
    }
  }
  #endregion
}

