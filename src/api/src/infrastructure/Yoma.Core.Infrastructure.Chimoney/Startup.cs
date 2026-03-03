using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.Reward.Interfaces.Provider;
using Yoma.Core.Infrastructure.Chimoney.Client;
using Yoma.Core.Infrastructure.Chimoney.Models;

namespace Yoma.Core.Infrastructure.Chimoney
{
  public static class Startup
  {
    public static void ConfigureServices_RewardCashoutProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.Configure<ChimoneyOptions>(options => configuration.GetSection(ChimoneyOptions.Section).Bind(options));
    }

    public static void ConfigureServices_InfrastructureLaborMarketProvider(this IServiceCollection services)
    {
      services.AddScoped<IRewardCashOutProviderClientFactory, ChimoneyClientFactory>();
    }
  }
}
