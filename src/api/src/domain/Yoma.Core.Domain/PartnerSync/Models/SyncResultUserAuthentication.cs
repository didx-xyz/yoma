namespace Yoma.Core.Domain.PartnerSync.Models
{
  /// <summary>
  /// Result returned after authenticating or linking a Yoma user with an external sync partner.
  /// </summary>
  public sealed class SyncResultUserAuthentication
  {
    /// <summary>
    /// Final URL to use after partner authentication/linking has completed.
    /// </summary>
    public string URL { get; set; } = null!;

    /// Optional updated partner-specific user link produced by the authentication/linking flow.
    /// Null when authentication is skipped or no partner-side user link was created or updated.
    /// </summary>
    public SyncInfoUserPartner? UserSyncInfo { get; set; }
  }
}
