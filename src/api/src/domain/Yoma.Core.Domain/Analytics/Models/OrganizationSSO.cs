using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Analytics.Models
{
  public class OrganizationSSO
  {
    public string Legend { get; set; }

    public bool Enabled => !string.IsNullOrEmpty(ClientId);

    public string? ClientId { get; set; }

    public TimeIntervalSummary? Logins { get; set; }
  }
}
