using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Yoma.Core.Test
{
  public class CustomWebApplicationFactory : WebApplicationFactory<Api.Program>
  {
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
      builder.UseEnvironment(Domain.Core.Environment.Local.ToString());

      builder.ConfigureAppConfiguration((context, configBuilder) =>
      {
        // Optional: Add test-specific config if needed
        // configBuilder.AddJsonFile("appsettings.Test.json", optional: true);
      });

      builder.ConfigureServices(services =>
      {
        // Optional: Override DI here, e.g., mock services or use in-memory DB
      });
    }
  }
}
