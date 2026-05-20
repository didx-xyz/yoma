using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Infrastructure.Alison.Client;
using Yoma.Core.Infrastructure.Alison.Context;
using Yoma.Core.Infrastructure.Alison.Interfaces;
using Yoma.Core.Infrastructure.Alison.Models;
using Yoma.Core.Infrastructure.Alison.Repositories;
using Yoma.Core.Infrastructure.Alison.Services;
using Yoma.Core.Infrastructure.Shared;
using Yoma.Core.Infrastructure.Shared.Interceptors;

namespace Yoma.Core.Infrastructure.Alison
{
  public static class Startup
  {
    public static void ConfigureServices_SyncProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.Configure<AlisonOptions>(options => configuration.GetSection(AlisonOptions.Section).Bind(options));
    }

    public static void ConfigureServices_InfrastructureSyncProvider(this IServiceCollection services, IConfiguration configuration, AppSettings appSettings)
    {
      services.AddDbContext<AlisonDbContext>((sp, options) =>
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

      // services
      services.AddScoped<IExecutionStrategyService, ExecutionStrategyService>();
      services.AddScoped<IOpportunityCatalogueBackgroundService, OpportunityCatalogueBackgroundService>();

      // clients
      services.AddKeyedScoped<ISyncProviderClientFactory<ISyncProviderClientPullEntity<Domain.Opportunity.Models.Opportunity>>, AlisonClientFactory>(SyncPartner.Alison);
      services.AddKeyedScoped<ISyncProviderClientFactory<ISyncProviderClientPullVerification>, AlisonClientFactory>(SyncPartner.Alison);
    }

    public static void Configure_InfrastructureDatabaseSyncProvider(this IServiceProvider serviceProvider)
    {
      using var scope = serviceProvider.CreateScope();
      var dbContext = scope.ServiceProvider.GetRequiredService<AlisonDbContext>();
      dbContext.Database.Migrate();
    }

    public static void Configure_RecurringJobsSyncProvider(this IConfiguration configuration)
    {
      var options = configuration.GetSection(AlisonOptions.Section).Get<AlisonOptions>() ?? throw new InvalidOperationException($"Failed to retrieve configuration section '{AlisonOptions.Section}'");

      var scheduledJobs = JobStorage.Current.GetMonitoringApi().ScheduledJobs(0, int.MaxValue)
        .Where(j => j.Value.Job.Type == typeof(IOpportunityCatalogueBackgroundService))
        .ToList();

      scheduledJobs.ForEach(o => BackgroundJob.Delete(o.Key));

      // Alison course catalogue synchronization.
      BackgroundJob.Enqueue<IOpportunityCatalogueBackgroundService>(s => s.RefreshCatalogue(true)); //execute on startup
      RecurringJob.AddOrUpdate<IOpportunityCatalogueBackgroundService>("Alison Opportunity Catalogue Synchronization", s => s.RefreshCatalogue(false), options.PollSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
    }
  }
}
