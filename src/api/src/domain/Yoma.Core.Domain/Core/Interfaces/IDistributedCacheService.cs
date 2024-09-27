namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IDistributedCacheService
  {
    T GetOrCreate<T>(string key, Func<T> valueProvider, TimeSpan? slidingExpiration = null, TimeSpan? absoluteExpirationRelativeToNow = null)
        where T : class;

    Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> valueProvider, TimeSpan? slidingExpiration = null, TimeSpan? absoluteExpirationRelativeToNow = null)
        where T : class;

    void Remove(string key);

    Task RemoveAsync(string key);
  }
}
