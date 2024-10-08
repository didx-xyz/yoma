using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Twilio.Clients;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Infrastructure.Twilio.Client;
using Yoma.Core.Infrastructure.Twilio.Models;

namespace Yoma.Core.Infrastructure.Twilio
{
  public static class Startup
  {
    public static void ConfigureServices_MessageProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.Configure<TwilioOpptions>(options => configuration.GetSection(TwilioOpptions.Section).Bind(options));
    }

    public static void ConfigureServices_InfrastructureMessageProvider(this IServiceCollection services, IConfiguration configuration)
    {
      var options = configuration.GetSection(TwilioOpptions.Section).Get<TwilioOpptions>()
          ?? throw new InvalidOperationException($"Failed to retrieve configuration section '{TwilioOpptions.Section}'");

      services.AddSingleton<ITwilioRestClient>(sp =>
      {
        return new TwilioRestClient(options.AccountSid, options.AuthToken);
      });

      services.AddScoped<IMessageProviderClientFactory, TwilioClientFactory>();
    }
  }
}