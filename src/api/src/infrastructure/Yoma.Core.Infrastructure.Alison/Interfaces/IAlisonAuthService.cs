namespace Yoma.Core.Infrastructure.Alison.Interfaces
{
  public interface IAlisonAuthService
  {
    Task<KeyValuePair<string, string>> GetAuthHeader();
  }
}
