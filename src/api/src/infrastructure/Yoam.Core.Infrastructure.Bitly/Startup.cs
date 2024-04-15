using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.ShortLinkProvider.Interfaces;
using Yoma.Core.Infrastructure.Bitly.Client;
using Yoma.Core.Infrastructure.Bitly.Models;

namespace Yoma.Core.Infrastructure.Bitly
{
  public static class Startup
  {
    public static void ConfigureServices_ShortLinkProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.Configure<BitlyOptions>(options => configuration.GetSection(BitlyOptions.Section).Bind(options));
    }

    public static void ConfigureServices_InfrastructureShortLinkProvider(this IServiceCollection services)
    {
      services.AddScoped<IShortLinkProviderClientFactory, BitlyClientFactory>();
    }
  }
}
