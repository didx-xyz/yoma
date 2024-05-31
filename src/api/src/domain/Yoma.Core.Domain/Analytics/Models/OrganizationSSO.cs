namespace Yoma.Core.Domain.Analytics.Models
{
  public class OrganizationSSO
  {
    public string Legend { get; set; }

    public bool Enabled => !string.IsNullOrWhiteSpace(ClientId);

    public string? ClientId { get; set; }

    public TimeIntervalSummary? Logins { get; set; }
  }
}
