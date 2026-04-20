namespace Yoma.Core.Domain.PartnerSync.Interfaces.Provider
{
  public interface ISyncProviderClientFactory<out TClient>
    where TClient : ISyncProviderClient
  {
    TClient CreateClient();
  }
}
