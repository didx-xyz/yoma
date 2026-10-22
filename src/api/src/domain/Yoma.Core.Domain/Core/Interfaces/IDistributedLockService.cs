using System.Runtime.CompilerServices;

namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IDistributedLockService
  {
    Task<bool> TryAcquireLockAsync(string key, TimeSpan lockDuration, [CallerMemberName] string processName = "Unknown");

    Task ReleaseLockAsync(string key, [CallerMemberName] string processName = "Unknown");

    Task RunWithLockAsync(string key, TimeSpan lockDuration, Func<Task> action, [CallerMemberName] string processName = "Unknown");

    Task<T> RunWithLockAsync<T>(string key, TimeSpan lockDuration, Func<Task<T>> action, [CallerMemberName] string processName = "Unknown");

    /// <summary>
    /// Runs the action under an ownership-checked lock, waiting at most the supplied acquisition timeout.
    /// Returns false without running the action when the lock remains busy. The lease is not renewed.
    /// </summary>
    Task<bool> TryRunWithLockAsync(string key, TimeSpan lockDuration, TimeSpan acquireTimeout, Func<Task> action,
      CancellationToken cancellationToken = default, [CallerMemberName] string processName = "Unknown");
  }
}
