using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SendGrid.Extensions.DependencyInjection;
using Yoma.Core.Domain.EmailProvider.Interfaces;
using Yoma.Core.Infrastructure.SendGrid.Client;
using Yoma.Core.Infrastructure.SendGrid.Models;

namespace Yoma.Core.Infrastructure.SendGrid
{
  public static class Startup
  {
    public static void ConfigureServices_EmailProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.Configure<SendGridOptions>(options => configuration.GetSection(SendGridOptions.Section).Bind(options));
    }

    public static void ConfigureServices_InfrastructureEmailProvider(this IServiceCollection services, IConfiguration configuration)
    {
      var options = configuration.GetSection(SendGridOptions.Section).Get<SendGridOptions>()
          ?? throw new InvalidOperationException($"Failed to retrieve configuration section '{SendGridOptions.Section}'");
      services.AddSendGrid(o => { o.ApiKey = options.ApiKey; });

      services.AddSingleton<IEmailProviderClientFactory, SendGridClientFactory>();
    }
  }
}
