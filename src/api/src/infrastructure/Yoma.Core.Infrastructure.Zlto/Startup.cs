using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.RewardsProvider.Interfaces;
using Yoma.Core.Infrastructure.Zlto.Client;
using Yoma.Core.Infrastructure.Zlto.Models;

namespace Yoma.Core.Infrastructure.Zlto
{
    public static class Startup
    {
        public static void ConfigureServices_RewardsProvider(this IServiceCollection services, IConfiguration configuration)
        {
            services.Configure<ZltoOptions>(options => configuration.GetSection(ZltoOptions.Section).Bind(options));
        }

        public static void ConfigureServices_InfrastructureRewardsProvider(this IServiceCollection services)
        {
            services.AddScoped<IRewardsProviderClientFactory, ZltoClientFactory>();
        }
    }
}
