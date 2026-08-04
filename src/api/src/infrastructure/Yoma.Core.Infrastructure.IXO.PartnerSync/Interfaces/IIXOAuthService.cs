namespace Yoma.Core.Infrastructure.IXO.PartnerSync.Interfaces
{
  public interface IIXOAuthService
  {
    Task<KeyValuePair<string, string>> GetAuthHeader();
  }
}
