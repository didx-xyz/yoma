using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Analytics.Models
{
  public class SSOMetrics
  {
    public string Legend { get; set; } = null!;

    public bool Enabled => !string.IsNullOrEmpty(ClientId);

    public string? ClientId { get; set; }

    public TimeIntervalSummary? Logins { get; set; }
  }
}
