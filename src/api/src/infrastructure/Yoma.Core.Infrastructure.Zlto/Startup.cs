using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Marketplace.Interfaces.Provider;
using Yoma.Core.Domain.Reward.Interfaces.Provider;
using Yoma.Core.Infrastructure.Zlto.Client;
using Yoma.Core.Infrastructure.Zlto.Models;

namespace Yoma.Core.Infrastructure.Zlto
{
  public static class Startup
  {
    public static IEndpointRouteBuilder MapRewardProviderHealthEndpoints(this IEndpointRouteBuilder endpoints, string apiVersion)
    {
      endpoints.MapHealthChecks($"/api/{apiVersion}/health/ready/zlto", new HealthCheckOptions
      {
        Predicate = check => check.Tags.Contains("zlto")
      }).AllowAnonymous();

      return endpoints;
    }

    public static void ConfigureServices_RewardProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.Configure<ZltoOptions>(options => configuration.GetSection(ZltoOptions.Section).Bind(options));
    }

    public static void ConfigureServices_InfrastructureRewardProvider(this IServiceCollection services)
    {
      services.AddScoped<IMarketplaceProviderClientFactory, ZltoClientFactory>();
      services.AddScoped<IRewardProviderClientFactory, ZltoClientFactory>();

      services.AddHealthChecks().Add(new HealthCheckRegistration(
        name: "ZLTO External",
        factory: sp => new HealthCheck(sp.GetRequiredService<IOptions<ZltoOptions>>().Value),
        failureStatus: HealthStatus.Unhealthy,
        tags: ["zlto"]));
    }
  }
}
