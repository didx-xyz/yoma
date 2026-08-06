using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Infrastructure.JobJack.Client;
using Yoma.Core.Infrastructure.JobJack.Context;
using Yoma.Core.Infrastructure.JobJack.Interfaces;
using Yoma.Core.Infrastructure.JobJack.Models;
using Yoma.Core.Infrastructure.JobJack.Repositories;
using Yoma.Core.Infrastructure.JobJack.Services;
using Yoma.Core.Infrastructure.Shared;
using Yoma.Core.Infrastructure.Shared.Interceptors;

namespace Yoma.Core.Infrastructure.JobJack
{
  public static class Startup
  {
    public static void ConfigureServices_SyncProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.Configure<JobJackOptions>(options => configuration.GetSection(JobJackOptions.Section).Bind(options));
    }

    public static void ConfigureServices_InfrastructureSyncProvider(this IServiceCollection services, IConfiguration configuration, AppSettings appSettings)
    {
      services.AddDbContext<JobJackDbContext>((sp, options) =>
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

      // client
      services.AddKeyedScoped<ISyncProviderClientFactory<ISyncProviderClientPullEntity<Domain.Opportunity.Models.Opportunity>>, JobJackClientFactory>(SyncPartner.JobJack);
    }

    public static void Configure_InfrastructureDatabaseSyncProvider(this IServiceProvider serviceProvider)
    {
      using var scope = serviceProvider.CreateScope();
      scope.ServiceProvider.GetRequiredService<JobJackDbContext>().Database.Migrate();
    }

    public static void Configure_RecurringJobsSyncProvider(this IConfiguration configuration)
    {
      var options = configuration.GetSection(JobJackOptions.Section).Get<JobJackOptions>()
        ?? throw new InvalidOperationException($"Failed to retrieve configuration section '{JobJackOptions.Section}'");

      var scheduledJobs = JobStorage.Current.GetMonitoringApi().ScheduledJobs(0, int.MaxValue)
        .Where(j => j.Value.Job.Type == typeof(IOpportunityFeedBackgroundService))
        .ToList();
      scheduledJobs.ForEach(o => BackgroundJob.Delete(o.Key));

      BackgroundJob.Enqueue<IOpportunityFeedBackgroundService>(s => s.RefreshFeed(true)); //execute on startup
      RecurringJob.AddOrUpdate<IOpportunityFeedBackgroundService>("JobJack Opportunity Feed Synchronization",
        s => s.RefreshFeed(false), options.PollSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
    }
  }
}
