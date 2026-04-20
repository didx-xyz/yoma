namespace Yoma.Core.Domain.PartnerSync.Interfaces.Provider
{
  public interface ISyncProviderClientFactoryResolver
  {
    TClient CreateClient<TClient>(Partner partner)
      where TClient : class, ISyncProviderClient;
  }
}
