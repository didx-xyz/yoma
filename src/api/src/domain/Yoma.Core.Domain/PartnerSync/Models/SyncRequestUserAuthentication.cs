namespace Yoma.Core.Domain.PartnerSync.Models
{
  /// <summary>
  /// Request used to authenticate or link a Yoma user with an external sync partner.
  ///
  /// The direct user fields represent the latest Yoma user profile values.
  /// EntitySyncInfo contains the synchronized entity partner context for the specific partner being authenticated.
  /// UserSyncInfo contains the existing partner-specific user link for that partner, when available.
  /// </summary>
  public sealed class SyncRequestUserAuthentication
  {
    public Guid UserId { get; set; }

    public string Username { get; set; } = null!;

    public string? Email { get; set; }

    public string? PhoneNumber { get; set; }

    public string? FirstName { get; set; }

    public string? Surname { get; set; }

    public Domain.Lookups.Models.Country? Country { get; set; }

    public SyncInfoEntityPartner EntitySyncInfo { get; set; } = null!;

    public SyncInfoUserPartner? UserSyncInfo { get; set; }
  }
}
