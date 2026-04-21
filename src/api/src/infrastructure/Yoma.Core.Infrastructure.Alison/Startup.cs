using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Infrastructure.Alison.Client;
using Yoma.Core.Infrastructure.Alison.Models;

namespace Yoma.Core.Infrastructure.Alison
{
  public static class Startup
  {
    public static void ConfigureServices_SyncProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.Configure<AlisonOptions>(options => configuration.GetSection(AlisonOptions.Section).Bind(options));
    }

    public static void ConfigureServices_InfrastructureSyncProvider(this IServiceCollection services)
    {
      services.AddScoped<ISyncProviderClientFactory<ISyncProviderClientPull<SyncItemOpportunity>>, AlisonClientFactory>();
    }
  }
}
