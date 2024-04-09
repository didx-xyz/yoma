namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IDistributedLockService
  {
    Task ReleaseLockAsync(string key);
    Task<bool> TryAcquireLockAsync(string key, TimeSpan lockDuration);
  }
}