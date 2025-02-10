using Newtonsoft.Json;
using Yoma.Core.Domain.BlobProvider;

namespace Yoma.Core.Domain.Analytics.Models
{
  public class OrganizationSSOInfo
  {
    public Guid Id { get; set; }

    public string Name { get; set; }

    public Guid? LogoId { get; set; }

    [JsonIgnore]
    public StorageType? LogoStorageType { get; set; }

    [JsonIgnore]
    public string? LogoKey { get; set; }

    public string? LogoURL { get; set; }

    /// <summary>
    /// Outbound SSO allowing logins on third-party systems using Yoma credentials
    /// </summary>
    public OrganizationSSO Outbound { get; set; }

    /// <summary>
    /// Inbound SSO allowing logins on Yoma's site using third-party credentials
    /// </summary>
    public OrganizationSSO Inbound { get; set; }
  }
}
