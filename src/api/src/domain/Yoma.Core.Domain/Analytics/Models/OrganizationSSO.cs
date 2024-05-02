namespace Yoma.Core.Domain.Analytics.Models
{
  public class OrganizationSSO
  {
    public bool Enabled => !string.IsNullOrWhiteSpace(ClientId);

    public string? ClientId { get; set; }

    public int? LoginCount { get; set; }
  }
}
