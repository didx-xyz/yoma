using System.Runtime.CompilerServices;

namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IDistributedLockService
  {
    Task<bool> TryAcquireLockAsync(string key, TimeSpan lockDuration, [CallerMemberName] string processName = "Unknown");

    Task ReleaseLockAsync(string keym, [CallerMemberName] string processName = "Unknown");
  }
}
