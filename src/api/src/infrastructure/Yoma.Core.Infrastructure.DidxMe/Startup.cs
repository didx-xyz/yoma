using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Infrastructure.DidxMe.Client;
using Yoma.Core.Infrastructure.DidxMe.Context;
using Yoma.Core.Infrastructure.DidxMe.Interfaces;
using Yoma.Core.Infrastructure.DidxMe.Models;
using Yoma.Core.Infrastructure.DidxMe.Repositories;
using Yoma.Core.Infrastructure.DidxMe.Services;
using Yoma.Core.Infrastructure.Shared;
using Yoma.Core.Infrastructure.Shared.Interceptors;

namespace Yoma.Core.Infrastructure.DidxMe
{
  public static class Startup
  {
    #region Public Members
    /// <summary>
    /// Registers provider configuration, issuer/holder authentication and wallet transport.
    /// Does not select or register an SSI provider factory; full registration is separate below.
    /// HTTP clients use the API host's existing Newtonsoft Flurl defaults, like other integrations.
    /// </summary>
    public static void ConfigureServices_DidxMe(this IServiceCollection services, IConfiguration configuration)
    {
      ArgumentNullException.ThrowIfNull(services, nameof(services));
      ArgumentNullException.ThrowIfNull(configuration, nameof(configuration));

      services.AddOptions<ProviderOptions>()
        .Bind(configuration.GetSection(ProviderOptions.Section))
        .Validate(options => options.RequestTimeoutSeconds > 0, $"{ProviderOptions.Section}.{nameof(ProviderOptions.RequestTimeoutSeconds)} must be positive")
        .Validate(options => options.IssuerRequestTimeoutSeconds > 0, $"{ProviderOptions.Section}.{nameof(ProviderOptions.IssuerRequestTimeoutSeconds)} must be positive")
        .Validate(options => options.AccessTokenRefreshBufferSeconds >= 0, $"{ProviderOptions.Section}.{nameof(ProviderOptions.AccessTokenRefreshBufferSeconds)} must be non-negative")
        .Validate(options => options.Holder != null && options.Holder.TokenAcquisitionTimeoutSeconds > 0, $"{ProviderOptions.Section}.{nameof(ProviderOptions.Holder)}.{nameof(HolderOptions.TokenAcquisitionTimeoutSeconds)} must be positive")
        .Validate(options => options.Webhook != null, $"{ProviderOptions.Section}.{nameof(ProviderOptions.Webhook)} is required")
        .Validate(options => options.Webhook == null || options.Webhook.WaitTimeoutSeconds > 0 && options.Webhook.PollIntervalMilliseconds > 0 &&
          options.Webhook.TimestampToleranceSeconds > 0, $"{ProviderOptions.Section}.{nameof(ProviderOptions.Webhook)} timeouts and polling interval must be positive")
        .ValidateOnStart();

      // Issuer tokens stay in process. Scoped holder auth uses Yoma's shared encrypted cache and
      // Data Protection key ring, retaining only the current request's token for paging.
      services.AddSingleton<IIssuerAuthService, IssuerAuthService>();
      services.AddScoped<IHolderAuthService, HolderAuthService>();
      services.AddScoped<IWalletClient, WalletClient>();
    }

    /// <summary>
    /// Registers the complete adapter when explicitly selected by a host or local dry-run harness.
    /// The API calls this directly. Returning to Aries requires a planned code and data cutover,
    /// including registration, database migrations and Aries SDK initialization; no config switch.
    /// </summary>
    public static void ConfigureServices_InfrastructureSSIProvider(
      this IServiceCollection services,
      IConfiguration configuration,
      AppSettings appSettings)
    {
      services.ConfigureServices_DidxMe(configuration);

      // Local SSI opt-out must still boot without a provisioned webhook secret.
      services.AddOptions<ProviderOptions>()
        .Validate<IEnvironmentProvider>((options, environment) =>
          !appSettings.SSIEnabledEnvironmentsAsEnum.HasFlag(environment.Environment) ||
          WebhookParser.IsSigningSecretValid(options.Webhook?.SigningSecret),
          $"{ProviderOptions.Section}.{nameof(ProviderOptions.Webhook)}.{nameof(WebhookOptions.SigningSecret)} must be a valid webhook signing secret when SSI is enabled");

      services.AddDbContext<ProviderDbContext>((sp, options) =>
      {
        options.UseNpgsql(configuration.Configuration_ConnectionString(), databaseOptions =>
        {
          databaseOptions.EnableRetryOnFailure(
            maxRetryCount: appSettings.DatabaseRetryPolicy.MaxRetryCount,
            maxRetryDelay: TimeSpan.FromSeconds(appSettings.DatabaseRetryPolicy.MaxRetryDelayInSeconds),
            errorCodesToAdd: null);
        })
        .AddInterceptors(sp.GetRequiredService<ForUpdateInterceptor>());
      }, ServiceLifetime.Scoped, ServiceLifetime.Scoped);

      // Repositories
      services.AddScoped<IRepository<CredentialPresetMapping>, CredentialPresetMappingRepository>();
      services.AddScoped<IRepository<IssuanceMapping>, IssuanceMappingRepository>();

      // Transport and services
      services.AddScoped<IIssuerClient, IssuerClient>();
      services.AddScoped<IPresetService, PresetService>();
      services.AddScoped<IHolderService, HolderService>();
      services.AddScoped<IWebhookParser, WebhookParser>();
      services.AddScoped<IProviderExecutionStrategyService, ExecutionStrategyService>();
      services.AddScoped<IIssuanceTrackingService, IssuanceTrackingService>();

      // Provider
      services.AddScoped<ISSIProviderClient, ProviderClient>();
      services.AddScoped<ISSIProviderClientFactory, ProviderClientFactory>();
    }

    public static void Configure_InfrastructureDatabaseSSIProvider(this IServiceProvider serviceProvider)
    {
      using var scope = serviceProvider.CreateScope();
      var context = scope.ServiceProvider.GetRequiredService<ProviderDbContext>();
      context.Database.Migrate();
    }
    #endregion
  }
}
