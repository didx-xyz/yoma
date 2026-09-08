namespace Yoma.Core.Infrastructure.Umuzi.Interfaces
{
  /// <summary>
  /// Authenticates Yoma's server-to-server API requests using client credentials.
  /// This is not learner pre-authentication and does not provide an auto-login session.
  /// </summary>
  public interface IUmuziAuthService
  {
    Task<KeyValuePair<string, string>> GetAuthHeader();
  }
}
