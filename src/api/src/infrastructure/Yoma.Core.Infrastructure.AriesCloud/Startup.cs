using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Infrastructure.AriesCloud.Client;
using Yoma.Core.Infrastructure.AriesCloud.Context;
using Yoma.Core.Infrastructure.AriesCloud.Interfaces;
using Yoma.Core.Infrastructure.AriesCloud.Models;
using Yoma.Core.Infrastructure.AriesCloud.Repositories;
using Yoma.Core.Infrastructure.AriesCloud.Services;

namespace Yoma.Core.Infrastructure.AriesCloud
{
  public static class Startup
  {
    public static void UseSSIProvider(this IApplicationBuilder applicationBuilder)
    {
      applicationBuilder.ApplicationServices.UseAriesCloudAPI();
    }

    public static void ConfigureServices_InfrastructureSSIProvider(this IServiceCollection services, IConfiguration configuration, string nameOrConnectionString, AppSettings appSettings)
    {
      if (string.IsNullOrWhiteSpace(nameOrConnectionString))
        throw new ArgumentNullException(nameof(nameOrConnectionString));
      nameOrConnectionString = nameOrConnectionString.Trim();

      var connectionString = configuration.GetConnectionString(nameOrConnectionString);
      if (string.IsNullOrEmpty(connectionString)) connectionString = nameOrConnectionString;

      services.AddDbContext<AriesCloudDbContext>(options =>
      {
        options.UseNpgsql(connectionString, options =>
              {
                options.EnableRetryOnFailure(
                          maxRetryCount: appSettings.DatabaseRetryPolicy.MaxRetryCount,
                          maxRetryDelay: TimeSpan.FromSeconds(appSettings.DatabaseRetryPolicy.MaxRetryDelayInSeconds),
                          errorCodesToAdd: null);
              })
              .ConfigureWarnings(w => w.Ignore(RelationalEventId.MultipleCollectionIncludeWarning)); //didable warning related to not using AsSplitQuery() as per MS SQL implementation
                                                                                                     //.UseLazyLoadingProxies(): without arguments is used to enable lazy loading. Simply not calling UseLazyLoadingProxies() ensure lazy loading is not enabled
      }, ServiceLifetime.Scoped, ServiceLifetime.Scoped);

      // repositories
      services.AddScoped<IRepository<Credential>, CredentialRepository>();
      services.AddScoped<IRepository<CredentialSchema>, CredentialSchemaRepository>();
      services.AddScoped<IRepository<Connection>, ConnectionRepository>();

      //sdk
      services.AddAriesCloudAPI();
      services.AddScoped<ISSIProviderClientFactory, AriesCloudClientFactory>();

      //service
      services.AddScoped<IExecutionStrategyService, ExecutionStrategyService>();
      services.AddScoped<ISSEListenerService, SSEListenerService>();
    }

    public static void Configure_InfrastructureDatabaseSSIProvider(this IServiceProvider serviceProvider)
    {
      using var scope = serviceProvider.CreateScope();
      var dbContext = scope.ServiceProvider.GetRequiredService<AriesCloudDbContext>();
      dbContext.Database.Migrate();
    }
  }
}
