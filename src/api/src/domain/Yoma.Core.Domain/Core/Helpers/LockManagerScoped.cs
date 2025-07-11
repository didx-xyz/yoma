using System.Collections.Concurrent;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class LockManagerScoped
  {
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

    public static async Task RunWithLockAsync(string key, Func<Task> action)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(key);
      ArgumentNullException.ThrowIfNull(action);

      var semaphore = _locks.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));
      await semaphore.WaitAsync();
      try
      {
        await action();
      }
      finally
      {
        semaphore.Release();
        _locks.TryRemove(key, out _);
      }
    }

    public static async Task<T> RunWithLockAsync<T>(string key, Func<Task<T>> action)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(key);
      ArgumentNullException.ThrowIfNull(action);

      var semaphore = _locks.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));
      await semaphore.WaitAsync();
      try
      {
        return await action();
      }
      finally
      {
        semaphore.Release();
        _locks.TryRemove(key, out _);
      }
    }
  }
}
