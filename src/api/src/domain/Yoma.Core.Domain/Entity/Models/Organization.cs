using Newtonsoft.Json;
using Yoma.Core.Domain.BlobProvider;

namespace Yoma.Core.Domain.Entity.Models
{
  public class Organization
  {
    public Guid Id { get; set; }

    public string Name { get; set; }

    public string NameHashValue { get; set; }

    public string? WebsiteURL { get; set; }

    public string? PrimaryContactName { get; set; }

    public string? PrimaryContactEmail { get; set; }

    public string? PrimaryContactPhone { get; set; }

    public string? VATIN { get; set; }

    public string? TaxNumber { get; set; }

    public string? RegistrationNumber { get; set; }

    public string? City { get; set; }

    public Guid? CountryId { get; set; }

    public string? Country { get; set; }

    public string? StreetAddress { get; set; }

    public string? Province { get; set; }

    public string? PostalCode { get; set; }

    public string? Tagline { get; set; }

    public string? Biography { get; set; }

    public Guid StatusId { get; set; }

    public OrganizationStatus Status { get; set; }

    public string? CommentApproval { get; set; }

    public DateTimeOffset? DateStatusModified { get; set; }

    public Guid? LogoId { get; set; }

    [JsonIgnore]
    public StorageType? LogoStorageType { get; set; }

    [JsonIgnore]
    public string? LogoKey { get; set; }

    public string? LogoURL { get; set; }

    /// <summary>
    /// Stores the Outbound SSO Client ID used for configuring SSO, allowing logins on third-party systems using Yoma credentials
    /// </summary>
    public string? SSOClientIdOutbound { get; set; }

    /// <summary>
    /// Stores the Inbound SSO Client ID used for configuring SSO, allowing logins on Yoma's site using third-party credentials
    /// </summary>
    public string? SSOClientIdInbound { get; set; }

    [JsonIgnore]
    public string? SettingsRaw { get; set; }

    public SettingsInfo? Settings { get; set; }

    public decimal? ZltoRewardPool { get; set; }

    public decimal? ZltoRewardCumulative { get; set; }

    public decimal? ZltoRewardBalance { get; set; }

    public decimal? YomaRewardPool { get; set; }

    public decimal? YomaRewardCumulative { get; set; }

    public decimal? YomaRewardBalance { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public Guid CreatedByUserId { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public Guid ModifiedByUserId { get; set; }

    public List<OrganizationDocument>? Documents { get; set; }

    public List<Lookups.OrganizationProviderType>? ProviderTypes { get; set; }

    public List<UserInfo>? Administrators { get; set; }
  }
}
