using System.Runtime.CompilerServices;

namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IDistributedLockService
  {
    Task<bool> TryAcquireLockAsync(string key, TimeSpan lockDuration, [CallerMemberName] string processName = "Unknown");

    Task ReleaseLockAsync(string key, [CallerMemberName] string processName = "Unknown");

    Task RunWithLockAsync(string key, TimeSpan lockDuration, Func<Task> action, [CallerMemberName] string processName = "Unknown");

    Task<T> RunWithLockAsync<T>(string key, TimeSpan lockDuration, Func<Task<T>> action, [CallerMemberName] string processName = "Unknown");
  }
}
