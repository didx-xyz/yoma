namespace Yoma.Core.Infrastructure.DidxMe.Interfaces
{
  /// <summary>
  /// Supplies service authentication for issuer-side operations. Holder wallet access requires
  /// a separately scoped authentication flow and must not reuse this service's token cache.
  /// </summary>
  public interface IDidxMeIssuerAuthService
  {
    Task<KeyValuePair<string, string>> GetAuthHeader(CancellationToken cancellationToken = default);
  }
}
