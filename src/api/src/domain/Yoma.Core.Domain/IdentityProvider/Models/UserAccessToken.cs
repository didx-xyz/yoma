namespace Yoma.Core.Domain.IdentityProvider.Models
{
  /// <summary>
  /// Short-lived user assertion obtained through the configured identity integration.
  /// Never log or persist its value. It is not a participant password or refresh token.
  /// </summary>
  public class UserAccessToken
  {
    public string AccessToken { get; set; } = null!;

    /// <summary>
    /// Remaining token lifetime in seconds.
    /// </summary>
    public int ExpiresIn { get; set; }
  }
}
