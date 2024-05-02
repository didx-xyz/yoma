namespace Yoma.Core.Domain.Analytics.Models
{
  public class OrganizationSearchResultsSSO
  {
    /// <summary>
    /// Outbound SSO allowing logins on third-party systems using Yoma credentials
    /// </summary>
    public OrganizationSSO Outbound { get; set; }

    /// <summary>
    /// Inbound SSO allowing logins on Yoma's site using third-party credentials
    /// </summary>
    public OrganizationSSO Inbound { get; set; }

    public DateTimeOffset DateStamp { get; set; }
  }
}
