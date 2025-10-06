using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.NewsFeedProvider.Interfaces.Provider;
using Yoma.Core.Domain.NewsFeedProvider.Models;
using Yoma.Core.Infrastructure.Substack.Client;
using Yoma.Core.Infrastructure.Substack.Context;
using Yoma.Core.Infrastructure.Substack.Interfaces;
using Yoma.Core.Infrastructure.Substack.Repositories;
using Yoma.Core.Infrastructure.Substack.Services;

namespace Yoma.Core.Infrastructure.Substack
{
  public static class Startup
  {
    public static void ConfigureServices_InfrastructureNewsFeedProvider(this IServiceCollection services,
      IConfiguration configuration,
      string nameOrConnectionString,
      AppSettings appSettings)
    {
      if (string.IsNullOrWhiteSpace(nameOrConnectionString))
        throw new ArgumentNullException(nameof(nameOrConnectionString));
      nameOrConnectionString = nameOrConnectionString.Trim();

      var connectionString = configuration.GetConnectionString(nameOrConnectionString);
      if (string.IsNullOrEmpty(connectionString)) connectionString = nameOrConnectionString;

      services.AddDbContext<SubstackDbContext>(options =>
      {
        options.UseNpgsql(connectionString, options =>
        {
          options.EnableRetryOnFailure(
                    maxRetryCount: appSettings.DatabaseRetryPolicy.MaxRetryCount,
                    maxRetryDelay: TimeSpan.FromSeconds(appSettings.DatabaseRetryPolicy.MaxRetryDelayInSeconds),
                    errorCodesToAdd: null);
        })
              .ConfigureWarnings(w => w.Ignore(RelationalEventId.MultipleCollectionIncludeWarning)); //disable warning related to not using AsSplitQuery() as per MS SQL implementation
                                                                                                     //.UseLazyLoadingProxies(): without arguments is used to enable lazy loading. Simply not calling UseLazyLoadingProxies() ensure lazy loading is not enabled
      }, ServiceLifetime.Scoped, ServiceLifetime.Scoped);

      // repositories
      services.AddScoped<IRepositoryValueContains<NewsArticle>, NewsArticleRepository>();
      services.AddScoped<IRepository<Models.FeedSyncTracking>, FeedSyncTrackingRepository>();

      //client
      services.AddScoped<INewsFeedProviderClientFactory, SubstackClientFactory>();

      //service
      services.AddScoped<IExecutionStrategyService, ExecutionStrategyService>();
      services.AddScoped<INewsFeedBackgroundService, NewsFeedBackgroundService>();
    }

    public static void Configure_InfrastructureDatabaseNewsFeedProvider(this IServiceProvider serviceProvider)
    {
      using var scope = serviceProvider.CreateScope();
      var dbContext = scope.ServiceProvider.GetRequiredService<SubstackDbContext>();
      dbContext.Database.Migrate();
    }
  }
}
