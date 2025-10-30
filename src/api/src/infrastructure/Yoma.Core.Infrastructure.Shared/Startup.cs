using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoma.Core.Infrastructure.Shared.Interceptors;

namespace Yoma.Core.Infrastructure.Shared
{
  public static class Startup
  {
    #region Class Variables
    private const string ConnectionStrings_SQLConnection = "SQLConnection";
    #endregion

    #region Public Members
    public static string Configuration_ConnectionString(this IConfiguration configuration)
    {
      var result = configuration.GetConnectionString(ConnectionStrings_SQLConnection);
      if (string.IsNullOrEmpty(result))
        throw new InvalidOperationException($"Failed to retrieve configuration section 'ConnectionStrings.{ConnectionStrings_SQLConnection}'");

      return result;
    }

    public static void ConfigureServices_InfrastructureShared(this IServiceCollection services)
    {
      services.AddSingleton<SerializableTransactionInterceptor>();
    }
    #endregion
  }
}
