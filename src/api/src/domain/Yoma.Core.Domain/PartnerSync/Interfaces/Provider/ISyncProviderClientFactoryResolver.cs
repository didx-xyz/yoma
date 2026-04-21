namespace Yoma.Core.Domain.PartnerSync.Interfaces.Provider
{
  public interface ISyncProviderClientFactoryResolver
  {
    TClient CreateClient<TClient>(Core.SyncPartner partner)
      where TClient : class, ISyncProviderClient;
  }
}
