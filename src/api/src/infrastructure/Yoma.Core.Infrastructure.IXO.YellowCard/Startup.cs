using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Payout.Interfaces.Provider;
using Yoma.Core.Infrastructure.IXO.YellowCard.Client;
using Yoma.Core.Infrastructure.IXO.YellowCard.Interfaces;
using Yoma.Core.Infrastructure.IXO.YellowCard.Models;
using Yoma.Core.Infrastructure.IXO.YellowCard.Services;

namespace Yoma.Core.Infrastructure.IXO.YellowCard
{
  public static class Startup
  {
    public static void ConfigureServices_PayoutProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services
        .AddOptions<YellowCardOptions>()
        .Bind(configuration.GetSection(YellowCardOptions.Section))
        .Validate(options => IsHttpsUrl(options.BaseUrl), $"{YellowCardOptions.Section}:{nameof(YellowCardOptions.BaseUrl)} must be a valid HTTPS URL")
        .Validate(options => IsHttpsUrl(options.SupportedCountriesUrl), $"{YellowCardOptions.Section}:{nameof(YellowCardOptions.SupportedCountriesUrl)} must be a valid HTTPS URL")
        .Validate(options => !string.IsNullOrWhiteSpace(options.AccessTokenPath), $"{YellowCardOptions.Section}:{nameof(YellowCardOptions.AccessTokenPath)} is required")
        .Validate(options => !string.IsNullOrWhiteSpace(options.PayoutsPath), $"{YellowCardOptions.Section}:{nameof(YellowCardOptions.PayoutsPath)} is required")
        .Validate(options => options.RequestTimeoutSeconds > 0, $"{YellowCardOptions.Section}:{nameof(YellowCardOptions.RequestTimeoutSeconds)} must be greater than zero")
        .Validate(options => !string.IsNullOrWhiteSpace(options.ClientId), $"{YellowCardOptions.Section}:{nameof(YellowCardOptions.ClientId)} is required")
        .Validate(options => !string.IsNullOrWhiteSpace(options.ClientSecret), $"{YellowCardOptions.Section}:{nameof(YellowCardOptions.ClientSecret)} is required")
        .Validate(options => !string.IsNullOrWhiteSpace(options.WebhookSigningSecret), $"{YellowCardOptions.Section}:{nameof(YellowCardOptions.WebhookSigningSecret)} is required")
        .Validate(options => options.WebhookTimestampToleranceInMinutes > 0, $"{YellowCardOptions.Section}:{nameof(YellowCardOptions.WebhookTimestampToleranceInMinutes)} must be greater than zero")
        .ValidateOnStart();
    }

    public static void ConfigureServices_InfrastructurePayoutProvider(this IServiceCollection services)
    {
      services.AddSingleton<IYellowCardAuthService, YellowCardAuthService>();
      services.AddScoped<IPayoutProviderClientFactory, YellowCardClientFactory>();
      services.AddScoped<IYellowCardWebhookParser, YellowCardWebhookParser>();
    }

    private static bool IsHttpsUrl(string? value)
    {
      return Uri.TryCreate(value, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps;
    }
  }
}
