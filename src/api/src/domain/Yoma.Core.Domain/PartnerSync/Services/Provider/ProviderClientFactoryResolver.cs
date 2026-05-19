using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;

namespace Yoma.Core.Domain.PartnerSync.Services.Provider
{
  public class ProviderClientFactoryResolver : ISyncProviderClientFactoryResolver
  {
    private readonly IServiceProvider _serviceProvider;

    public ProviderClientFactoryResolver(IServiceProvider serviceProvider)
    {
      _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
    }

    public TClient CreateClient<TClient>(SyncPartner partner)
      where TClient : class, ISyncProviderClient
    {
      var factory = _serviceProvider.GetKeyedService<ISyncProviderClientFactory<TClient>>(partner);

      return factory == null
        ? throw new InvalidOperationException($"Factory not registered for partner '{partner}' and client type '{typeof(TClient).Name}'")
        : factory.CreateClient();
    }
  }
}

