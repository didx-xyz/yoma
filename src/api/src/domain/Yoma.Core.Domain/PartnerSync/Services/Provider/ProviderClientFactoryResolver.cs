using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;

namespace Yoma.Core.Domain.PartnerSync.Services.Provider
{
  public class ProviderClientFactoryResolver : ISyncProviderClientFactoryResolver
  {
    #region Class Variables
    private readonly IDictionary<(Core.SyncPartner Partner, Type ClientType), object> _factories;
    #endregion

    #region Constructor
    public ProviderClientFactoryResolver(IDictionary<(Core.SyncPartner Partner, Type ClientType), object> factories)
    {
      _factories = factories;
    }
    #endregion

    #region Public Members
    public TClient CreateClient<TClient>(Core.SyncPartner partner)
      where TClient : class, ISyncProviderClient
    {
      if (_factories.TryGetValue((partner, typeof(TClient)), out var factory))
        return ((ISyncProviderClientFactory<TClient>)factory).CreateClient();

      throw new InvalidOperationException($"Factory not registered for partner '{partner}' and client type '{typeof(TClient).Name}'");
    }
    #endregion
  }
}

