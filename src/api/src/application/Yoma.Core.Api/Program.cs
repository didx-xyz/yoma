using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Api
{
    public class Program
    {
        #region Public Members
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.ConfigureAppConfiguration((hostingContext, config) =>
                    {
                        var appSettings = config.Build().GetSection(AppSettings.Section).Get<AppSettings>() ?? throw new InvalidOperationException($"Failed to retrieve configuration section '{AppSettings.Section}'");

                        IWebHostEnvironment webHostEnvironment = hostingContext.HostingEnvironment;
                        var environment = EnvironmentHelper.FromString(webHostEnvironment.EnvironmentName);

                        if (appSettings.SentryEnabledEnvironmentsAsEnum.HasFlag(environment)) webBuilder.UseSentry();
                    });
                    webBuilder.UseStartup<Startup>();
                });
        #endregion
    }
}
