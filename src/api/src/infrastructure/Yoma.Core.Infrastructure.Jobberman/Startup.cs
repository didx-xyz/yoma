using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Infrastructure.Jobberman.Client;
using Yoma.Core.Infrastructure.Jobberman.Models;

namespace Yoma.Core.Infrastructure.Jobberman
{
  public static class Startup
  {
    public static void ConfigureServices_SyncProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.Configure<JobbermanOptions>(options => configuration.GetSection(JobbermanOptions.Section).Bind(options));
    }

    public static void ConfigureServices_InfrastructureSyncProvider(this IServiceCollection services)
    {
      services.AddScoped<ISyncProviderClientFactory<ISyncProviderClientPull<Opportunity>>, JobbermanClientFactory>();
    }
  }
}
