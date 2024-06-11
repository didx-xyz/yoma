using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Domain.PartnerSharing.Interfaces.Provider;
using Yoma.Core.Infrastructure.SAYouth.Client;
using Yoma.Core.Infrastructure.SAYouth.Models;

namespace Yoma.Core.Infrastructure.SAYouth
{
  public static class Startup
  {
    public static void ConfigureServices_SharingProvider(this IServiceCollection services, IConfiguration configuration)
    {
      services.Configure<SAYouthOptions>(options => configuration.GetSection(SAYouthOptions.Section).Bind(options));
    }

    public static void ConfigureServices_InfrastructureSharingProvider(this IServiceCollection services)
    {
      services.AddSingleton<ISharingProviderClientFactory, SAYouthClientFactory>();
    }
  }
}
