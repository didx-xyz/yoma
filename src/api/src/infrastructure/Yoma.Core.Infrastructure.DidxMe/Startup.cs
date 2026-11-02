using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
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
        .Validate(options => options.RequestTimeoutSeconds > 0, "DidxMe.RequestTimeoutSeconds must be positive")
        .Validate(options => options.IssuerRequestTimeoutSeconds > 0, "DidxMe.IssuerRequestTimeoutSeconds must be positive")
        .Validate(options => options.AccessTokenRefreshBufferSeconds >= 0, "DidxMe.AccessTokenRefreshBufferSeconds must be non-negative")
        .ValidateOnStart();

      services.TryAddSingleton(TimeProvider.System);
      // Issuer tokens stay in process. Scoped holder auth uses Yoma's shared encrypted cache and
      // Data Protection key ring, retaining only the current request's token for paging.
      services.AddSingleton<IIssuerAuthService, IssuerAuthService>();
      services.AddScoped<IHolderAuthService, HolderAuthService>();
      services.AddScoped<WalletClient>();
      services.AddScoped<BackgroundWalletService>();
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
      services.AddScoped<IssuerClient>();
      services.AddScoped<PresetService>();
      services.AddScoped<HolderContextService>();

      // Provider
      services.AddScoped<ProviderClient>();
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
