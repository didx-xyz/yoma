using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Yoma.Core.Domain.PartnerSharing.Interfaces.Provider;
using Yoma.Core.Infrastructure.SAYouth.Client;
using Yoma.Core.Infrastructure.SAYouth.Models;

namespace Yoma.Core.Infrastructure.SAYouth
{
  public static class Startup
  {
    public static IEndpointRouteBuilder MapSharingProviderHealthEndpoints(this IEndpointRouteBuilder endpoints, string apiVersion)
    {
      endpoints.MapHealthChecks($"/api/{apiVersion}/health/ready/sayouth", new HealthCheckOptions
      {
        Predicate = check => check.Tags.Contains("sayouth")
      }).AllowAnonymous();

      return endpoints;
    }

    public static void ConfigureServices_SharingProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.Configure<SAYouthOptions>(options => configuration.GetSection(SAYouthOptions.Section).Bind(options));
    }

    public static void ConfigureServices_InfrastructureSharingProvider(this IServiceCollection services)
    {
      services.AddScoped<ISharingProviderClientFactory, SAYouthClientFactory>();
      services.AddSingleton<HealthCheck>();

      services.AddHealthChecks().AddCheck<HealthCheck>(name: "SAYouth External", failureStatus: HealthStatus.Unhealthy, tags: ["sayouth"]);
    }
  }
}
