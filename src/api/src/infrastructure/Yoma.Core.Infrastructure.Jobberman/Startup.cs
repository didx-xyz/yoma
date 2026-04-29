using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Infrastructure.Jobberman.Client;
using Yoma.Core.Infrastructure.Jobberman.Context;
using Yoma.Core.Infrastructure.Jobberman.Models;
using Yoma.Core.Infrastructure.Jobberman.Repositories;
using Yoma.Core.Infrastructure.Jobberman.Services;
using Yoma.Core.Infrastructure.Shared;
using Yoma.Core.Infrastructure.Shared.Interceptors;
using Yoma.Core.Infrastructure.Jobberman.Interfaces;

namespace Yoma.Core.Infrastructure.Jobberman
{
  public static class Startup
  {
    public static void ConfigureServices_SyncProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.Configure<JobbermanOptions>(options => configuration.GetSection(JobbermanOptions.Section).Bind(options));
    }

    public static void ConfigureServices_InfrastructureSyncProvider(this IServiceCollection services, IConfiguration configuration, AppSettings appSettings)
    {
      services.AddDbContext<JobbermanDbContext>((sp, options) =>
      {
        options.UseNpgsql(configuration.Configuration_ConnectionString(), options =>
        {
          options.EnableRetryOnFailure(
                    maxRetryCount: appSettings.DatabaseRetryPolicy.MaxRetryCount,
                    maxRetryDelay: TimeSpan.FromSeconds(appSettings.DatabaseRetryPolicy.MaxRetryDelayInSeconds),
                    errorCodesToAdd: null);
        })
        //disable warning related to not using AsSplitQuery() as per MS SQL implementation
        //.UseLazyLoadingProxies(): without arguments is used to enable lazy loading. Simply not calling UseLazyLoadingProxies() ensure lazy loading is not enabled
        .ConfigureWarnings(w => w.Ignore(RelationalEventId.MultipleCollectionIncludeWarning))
        .AddInterceptors(sp.GetRequiredService<ForUpdateInterceptor>());
      }, ServiceLifetime.Scoped, ServiceLifetime.Scoped);

      // repositories
      services.AddScoped<IRepositoryBatched<Opportunity>, OpportunityRepository>();
      services.AddScoped<IRepository<FeedSyncTracking>, FeedSyncTrackingRepository>();

      // services
      services.AddScoped<IExecutionStrategyService, ExecutionStrategyService>();
      services.AddScoped<IOpportunityFeedBackgroundService, OpportunityFeedBackgroundService>();

      // clinet
      services.AddScoped<ISyncProviderClientFactory<ISyncProviderClientPull<Domain.Opportunity.Models.Opportunity>>, JobbermanClientFactory>();
    }

    public static void Configure_InfrastructureDatabaseSyncProvider(this IServiceProvider serviceProvider)
    {
      using var scope = serviceProvider.CreateScope();
      var dbContext = scope.ServiceProvider.GetRequiredService<JobbermanDbContext>();
      dbContext.Database.Migrate();
    }

    public static void Configure_RecurringJobsSyncProvider(this IConfiguration configuration)
    {
      var options = configuration.GetSection(JobbermanOptions.Section).Get<JobbermanOptions>() ?? throw new InvalidOperationException($"Failed to retrieve configuration section '{JobbermanOptions.Section}'");

      var scheduledJobs = JobStorage.Current.GetMonitoringApi().ScheduledJobs(0, int.MaxValue)
        .Where(j => j.Value.Job.Type == typeof(IOpportunityFeedBackgroundService))
        .ToList();

      scheduledJobs.ForEach(o => BackgroundJob.Delete(o.Key));

      //news feed synchronization
      BackgroundJob.Enqueue<IOpportunityFeedBackgroundService>(s => s.RefreshFeeds(true)); //execute on startup
      RecurringJob.AddOrUpdate<IOpportunityFeedBackgroundService>("Jobberman Opportunity Feed Synchronization", s => s.RefreshFeeds(false), options.PollSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
    }
  }
}
