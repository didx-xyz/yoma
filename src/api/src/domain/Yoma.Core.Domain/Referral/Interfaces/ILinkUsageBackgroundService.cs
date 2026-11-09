using Hangfire;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface ILinkUsageBackgroundService
  {
    /// <summary>
    /// Manually re-evaluates Pending claims through normal completion processing.
    /// Existing expiry rules apply; terminal claims are not reopened.
    /// </summary>
    [AutomaticRetry(Attempts = 0)]
    Task ProcessPendingProgress(CancellationToken cancellationToken);

    Task ProcessExpiration();

    Task ProcessAbandoned();
  }
}
