using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Yoma.Core.Infrastructure.DidxMe.Interfaces;
using Yoma.Core.Infrastructure.DidxMe.Models;
using Yoma.Core.Infrastructure.DidxMe.Services;

namespace Yoma.Core.Infrastructure.DidxMe
{
  public static class Startup
  {
    /// <summary>
    /// Registers the infrastructure's configuration and issuer authentication foundation.
    /// The API does not call this yet; it does not select or register an SSI provider factory.
    /// </summary>
    public static void ConfigureServices_DidxMe(this IServiceCollection services, IConfiguration configuration)
    {
      ArgumentNullException.ThrowIfNull(services, nameof(services));
      ArgumentNullException.ThrowIfNull(configuration, nameof(configuration));

      services.Configure<DidxMeOptions>(options => configuration.GetSection(DidxMeOptions.Section).Bind(options));

      services.TryAddSingleton(TimeProvider.System);
      services.AddSingleton<IDidxMeIssuerAuthService, DidxMeIssuerAuthService>();
    }
  }
}
