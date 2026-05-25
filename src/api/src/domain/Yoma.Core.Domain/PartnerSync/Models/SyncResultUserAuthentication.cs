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

    /// <summary>
    /// Updated partner-specific user link produced by the authentication/linking flow.
    /// </summary>
    public SyncInfoUserPartner UserSyncInfo { get; set; } = null!;
  }
}
