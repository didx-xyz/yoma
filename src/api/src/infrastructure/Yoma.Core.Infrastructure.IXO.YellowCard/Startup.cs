using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.Payout.Interfaces.Provider;
using Yoma.Core.Infrastructure.IXO.YellowCard.Client;
using Yoma.Core.Infrastructure.IXO.YellowCard.Interfaces;
using Yoma.Core.Infrastructure.IXO.YellowCard.Models;
using Yoma.Core.Infrastructure.IXO.YellowCard.Services;

namespace Yoma.Core.Infrastructure.IXO.YellowCard
{
  public static class Startup
  {
    public static void ConfigureServices_PayoutProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.Configure<YellowCardOptions>(options => configuration.GetSection(YellowCardOptions.Section).Bind(options));
    }

    public static void ConfigureServices_InfrastructurePayoutProvider(this IServiceCollection services)
    {
      services.AddSingleton<IYellowCardAuthService, YellowCardAuthService>();
      services.AddScoped<IPayoutProviderClientFactory, YellowCardClientFactory>();
      services.AddScoped<IYellowCardWebhookParser, YellowCardWebhookParser>();
    }
  }
}
