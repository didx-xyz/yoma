namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  /// <summary>
  /// Supplied by the authenticated request adapter after Yoma has validated the access token.
  /// HolderId comes from the trusted identity mapping, never from a caller-selected wallet ID.
  /// </summary>
  public class HolderContext
  {
    public string AccessToken { get; init; } = null!;

    /// <summary>
    /// Authenticated Yoma Keycloak subject, registered as the didx:me external identifier.
    /// Used to validate the source token and Yoma assertion, not as the wallet owner ID.
    /// </summary>
    public string UserId { get; init; } = null!;

    /// <summary>
    /// Actual didx:me consumer ID, also stored as the domain holder TenantId. The exchanged
    /// didx:me token must have this subject; issuance and wallet correlations use this ID.
    /// </summary>
    public string HolderId { get; init; } = null!;
  }
}
