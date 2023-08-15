using Yoma.Core.Domain.Core.Helpers;

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
              IWebHostEnvironment webHostEnvironment = hostingContext.HostingEnvironment;
              var environment = EnvironmentHelper.FromString(webHostEnvironment.EnvironmentName);

              if (environment != Domain.Core.Environment.Local) webBuilder.UseSentry();
            });
          webBuilder.UseStartup<Startup>();
        });
    #endregion
  }
}
