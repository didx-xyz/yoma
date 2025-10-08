using Hangfire;
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
using Yoma.Core.Infrastructure.Substack.Models;
using Yoma.Core.Infrastructure.Substack.Repositories;
using Yoma.Core.Infrastructure.Substack.Services;

namespace Yoma.Core.Infrastructure.Substack
{
  public static class Startup
  {
    public static void ConfigureServices_NewsFeedProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.Configure<SubstackOptions>(options => configuration.GetSection(SubstackOptions.Section).Bind(options));
    }

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
      services.AddScoped<IRepositoryBatchedValueContains<NewsArticle>, NewsArticleRepository>();
      services.AddScoped<IRepository<FeedSyncTracking>, FeedSyncTrackingRepository>();

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

    public static void Configure_RecurringJobsNewsFeedProvider(this IConfiguration configuration)
    {
      var options = configuration.GetSection(SubstackOptions.Section).Get<SubstackOptions>() ?? throw new InvalidOperationException($"Failed to retrieve configuration section '{SubstackOptions.Section}'");

      var scheduledJobs = JobStorage.Current.GetMonitoringApi().ScheduledJobs(0, int.MaxValue)
        .Where(j => j.Value.Job.Type == typeof(INewsFeedBackgroundService))
        .ToList();

      scheduledJobs.ForEach(o => BackgroundJob.Delete(o.Key));

      //news feed synchronization
      BackgroundJob.Enqueue<INewsFeedBackgroundService>(s => s.RefreshFeeds(true)); //execute on startup
      RecurringJob.AddOrUpdate<INewsFeedBackgroundService>("News Feed Synchronization", s => s.RefreshFeeds(false), options.PollSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
    }
  }
}
