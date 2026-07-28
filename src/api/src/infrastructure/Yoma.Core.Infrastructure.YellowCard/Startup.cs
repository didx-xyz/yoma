using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.Reward.Interfaces.Provider;
using Yoma.Core.Infrastructure.YellowCard.Client;
using Yoma.Core.Infrastructure.YellowCard.Interfaces;
using Yoma.Core.Infrastructure.YellowCard.Models;
using Yoma.Core.Infrastructure.YellowCard.Services;

namespace Yoma.Core.Infrastructure.YellowCard
{
  public static class Startup
  {
    public static void ConfigureServices_RewardCashOutProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.Configure<YellowCardOptions>(options => configuration.GetSection(YellowCardOptions.Section).Bind(options));
    }

    public static void ConfigureServices_InfrastructureRewardCashOutProvider(this IServiceCollection services)
    {
      services.AddScoped<IRewardCashOutProviderClientFactory, YellowCardClientFactory>();
      services.AddScoped<IYellowCardWebhookParser, YellowCardWebhookParser>();
    }
  }
}
