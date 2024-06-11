using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.LaborMarketProvider.Interfaces;
using Yoma.Core.Infrastructure.Emsi.Client;
using Yoma.Core.Infrastructure.Emsi.Models;

namespace Yoma.Core.Infrastructure.Emsi
{
  public static class Startup
  {
    public static void ConfigureServices_LaborMarketProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.Configure<EmsiOptions>(options => configuration.GetSection(EmsiOptions.Section).Bind(options));
    }

    public static void ConfigureServices_InfrastructureLaborMarketProvider(this IServiceCollection services)
    {
      services.AddSingleton<ILaborMarketProviderClientFactory, EmsiClientFactory>();
    }
  }
}
