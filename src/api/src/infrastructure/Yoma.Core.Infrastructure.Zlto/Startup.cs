using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.Marketplace.Interfaces.Provider;
using Yoma.Core.Domain.Reward.Interfaces.Provider;
using Yoma.Core.Infrastructure.Zlto.Client;
using Yoma.Core.Infrastructure.Zlto.Models;

namespace Yoma.Core.Infrastructure.Zlto
{
  public static class Startup
  {
    public static void ConfigureServices_RewardProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.Configure<ZltoOptions>(options => configuration.GetSection(ZltoOptions.Section).Bind(options));
    }

    public static void ConfigureServices_InfrastructureRewardProvider(this IServiceCollection services)
    {
      services.AddScoped<IMarketplaceProviderClientFactory, ZltoClientFactory>();
      services.AddScoped<IRewardProviderClientFactory, ZltoClientFactory>();
    }
  }
}
