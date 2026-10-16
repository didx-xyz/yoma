using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Test.Core
{
  public class ExecutionStrategyRegistrationTests
  {
    #region Public Members
    [Fact]
    public void PartnerRegistrationsDoNotOverrideApplicationExecutionStrategy()
    {
      var services = new ServiceCollection();
      var configuration = new ConfigurationBuilder().Build();
      var settings = new AppSettings();

      services.AddScoped<IExecutionStrategyService, Infrastructure.Database.Core.Services.ExecutionStrategyService>();
      Infrastructure.JobJack.Startup.ConfigureServices_InfrastructureSyncProvider(services, configuration, settings);
      Infrastructure.IXO.PartnerSync.Startup.ConfigureServices_InfrastructureSyncProvider(services, configuration, settings);

      // CSV probes must clear the application context, not a partner context with
      // a separate change tracker, before repeating the operation for commit.
      var application = Assert.Single(services, o => o.ServiceType == typeof(IExecutionStrategyService));
      Assert.Equal(typeof(Infrastructure.Database.Core.Services.ExecutionStrategyService), application.ImplementationType);

      Assert.Single(services, o => o.ServiceType == typeof(Infrastructure.JobJack.Services.ExecutionStrategyService));
      Assert.Single(services, o => o.ServiceType == typeof(Infrastructure.IXO.PartnerSync.Services.ExecutionStrategyService));
    }
    #endregion
  }
}
