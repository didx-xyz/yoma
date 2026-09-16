namespace Yoma.Core.Infrastructure.IXO.YellowCard.Interfaces
{
  public interface IYellowCardAuthService
  {
    Task<KeyValuePair<string, string>> GetAuthHeader();
  }
}
