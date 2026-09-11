using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Infrastructure.IXO.PartnerSync.Client;
using Yoma.Core.Infrastructure.IXO.PartnerSync.Context;
using Yoma.Core.Infrastructure.IXO.PartnerSync.Interfaces;
using Yoma.Core.Infrastructure.IXO.PartnerSync.Models;
using Yoma.Core.Infrastructure.IXO.PartnerSync.Repositories;
using Yoma.Core.Infrastructure.IXO.PartnerSync.Services;
using Yoma.Core.Infrastructure.Shared;
using Yoma.Core.Infrastructure.Shared.Interceptors;

namespace Yoma.Core.Infrastructure.IXO.PartnerSync
{
  public static class Startup
  {
    public static void ConfigureServices_SyncProvider(
      this IServiceCollection services,
      IConfiguration configuration)
    {
      services.Configure<IXOPartnerSyncOptions>(
        options => configuration.GetSection(IXOPartnerSyncOptions.Section).Bind(options));
    }

    public static void ConfigureServices_InfrastructureSyncProvider(
      this IServiceCollection services,
      IConfiguration configuration,
      AppSettings appSettings)
    {
      services.AddDbContext<IXOPartnerSyncDbContext>((sp, options) =>
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
      services.AddSingleton<IIXOAuthService, IXOAuthService>();
      services.AddScoped<IExecutionStrategyService, ExecutionStrategyService>();
      services.AddScoped<IOpportunityCatalogueBackgroundService, OpportunityCatalogueBackgroundService>();

      // clients
      services.AddKeyedScoped<ISyncProviderClientFactory<ISyncProviderClientPullEntity<Domain.Opportunity.Models.OpportunityRequestCreate>>, IXOClientFactory>(SyncPartner.IXO);
      services.AddKeyedScoped<ISyncProviderClientFactory<ISyncProviderClientPullVerification>, IXOClientFactory>(SyncPartner.IXO);
      services.AddKeyedScoped<ISyncProviderClientFactory<ISyncProviderClientUserAuthentication>, IXOClientFactory>(SyncPartner.IXO);
    }

    public static void Configure_InfrastructureDatabaseSyncProvider(this IServiceProvider serviceProvider)
    {
      using var scope = serviceProvider.CreateScope();
      var dbContext = scope.ServiceProvider.GetRequiredService<IXOPartnerSyncDbContext>();
      dbContext.Database.Migrate();
    }

    public static void Configure_RecurringJobsSyncProvider(this IConfiguration configuration)
    {
      var options = configuration.GetSection(IXOPartnerSyncOptions.Section).Get<IXOPartnerSyncOptions>()
        ?? throw new InvalidOperationException(
          $"Failed to retrieve configuration section '{IXOPartnerSyncOptions.Section}'");

      var scheduledJobs = JobStorage.Current.GetMonitoringApi()
        .ScheduledJobs(0, int.MaxValue)
        .Where(job => job.Value.Job.Type == typeof(IOpportunityCatalogueBackgroundService))
        .ToList();

      scheduledJobs.ForEach(job => BackgroundJob.Delete(job.Key));

      BackgroundJob.Enqueue<IOpportunityCatalogueBackgroundService>(service => service.RefreshCatalogue(true));
      RecurringJob.AddOrUpdate<IOpportunityCatalogueBackgroundService>("IXO Partner Sync Opportunity Catalogue Synchronization", service => service.RefreshCatalogue(false), options.PollSchedule, new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
    }
  }
}
