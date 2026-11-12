using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Transactions;
using Xunit;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Opportunity.Entities;

namespace Yoma.Core.Test.Completion
{
  public class CompletionContextCleanupTests
  {
    #region Tests
    [Theory]
    [InlineData(true, false, false)]
    [InlineData(false, true, false)]
    [InlineData(true, true, false)]
    [InlineData(true, true, true)]
    public async Task CompletionBoundaryClearsApplicationStateWithPartnerProviders(bool jobJack, bool ixo, bool fails)
    {
      using var provider = CreateProvider(jobJack, ixo);
      using var scope = provider.CreateScope();
      var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
      var strategy = scope.ServiceProvider.GetRequiredService<IExecutionStrategyService>();
      Assert.Single(scope.ServiceProvider.GetServices<IExecutionStrategyService>());
      var opportunity = new Opportunity { Id = Guid.NewGuid(), ParticipantCount = 5 };
      context.Attach(opportunity);
      var didxMeContext = scope.ServiceProvider.GetRequiredService<Infrastructure.DidxMe.Context.ProviderDbContext>();
      var issuance = new Infrastructure.DidxMe.Entities.IssuanceMapping { Id = Guid.NewGuid() };
      didxMeContext.Attach(issuance);

      // No database is needed to reproduce the accepted state retained after a CSV probe rollback.
      using var transaction = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);
      async Task Execute() => await strategy.ExecuteInExecutionStrategyAsync(() =>
      {
        opportunity.ParticipantCount = 6;
        context.ChangeTracker.DetectChanges();
        context.ChangeTracker.AcceptAllChanges();
        if (fails) throw new InvalidOperationException("Completion failed after allocation");
        return Task.CompletedTask;
      }, clearTrackedChanges: true);

      if (fails) await Assert.ThrowsAsync<InvalidOperationException>(Execute);
      else await Execute();

      Assert.Empty(context.ChangeTracker.Entries());
      Assert.Same(issuance, Assert.Single(didxMeContext.ChangeTracker.Entries()).Entity);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task DidxMeCleanupPreservesApplicationAndOtherProviderTracking(bool fails)
    {
      using var provider = CreateProvider(true, true);
      using var scope = provider.CreateScope();
      var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
      var opportunity = new Opportunity { Id = Guid.NewGuid(), ParticipantCount = 5 };
      context.Attach(opportunity);
      var ixoContext = scope.ServiceProvider.GetRequiredService<Infrastructure.IXO.PartnerSync.Context.IXOPartnerSyncDbContext>();
      var catalogueItem = new Infrastructure.IXO.PartnerSync.Entities.Opportunity { Id = Guid.NewGuid() };
      ixoContext.Attach(catalogueItem);
      var didxMeContext = scope.ServiceProvider.GetRequiredService<Infrastructure.DidxMe.Context.ProviderDbContext>();
      didxMeContext.Attach(new Infrastructure.DidxMe.Entities.IssuanceMapping { Id = Guid.NewGuid() });
      var strategy = scope.ServiceProvider.GetRequiredService<Infrastructure.DidxMe.Services.ExecutionStrategyService>();

      using var transaction = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);
      async Task Execute() => await strategy.ExecuteInExecutionStrategyAsync(() =>
      {
        if (fails) throw new InvalidOperationException("Provider operation failed");
        return Task.CompletedTask;
      }, clearTrackedChanges: true);

      if (fails) await Assert.ThrowsAsync<InvalidOperationException>(Execute);
      else await Execute();

      Assert.Empty(didxMeContext.ChangeTracker.Entries());
      Assert.Same(opportunity, Assert.Single(context.ChangeTracker.Entries()).Entity);
      Assert.Equal(5, opportunity.ParticipantCount);
      Assert.Same(catalogueItem, Assert.Single(ixoContext.ChangeTracker.Entries()).Entity);
    }

    [Fact]
    public async Task NestedCompletionWithoutCleanupPreservesApplicationTracking()
    {
      using var provider = CreateProvider(true, true);
      using var scope = provider.CreateScope();
      var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
      var opportunity = new Opportunity { Id = Guid.NewGuid(), ParticipantCount = 5 };
      context.Attach(opportunity);

      using var transaction = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);
      await scope.ServiceProvider.GetRequiredService<IExecutionStrategyService>()
        .ExecuteInExecutionStrategyAsync(() => Task.CompletedTask);

      Assert.Same(opportunity, Assert.Single(context.ChangeTracker.Entries()).Entity);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task ProviderCleanupRemainsScopedToItsOwnContext(bool jobJack)
    {
      using var provider = CreateProvider(true, true);
      using var scope = provider.CreateScope();
      var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
      context.Attach(new Opportunity { Id = Guid.NewGuid() });
      var jobJackContext = scope.ServiceProvider.GetRequiredService<Infrastructure.JobJack.Context.JobJackDbContext>();
      var ixoContext = scope.ServiceProvider.GetRequiredService<Infrastructure.IXO.PartnerSync.Context.IXOPartnerSyncDbContext>();
      jobJackContext.Attach(new Infrastructure.JobJack.Entities.Opportunity { Id = Guid.NewGuid() });
      ixoContext.Attach(new Infrastructure.IXO.PartnerSync.Entities.Opportunity { Id = Guid.NewGuid() });
      IExecutionStrategyService strategy = jobJack
        ? scope.ServiceProvider.GetRequiredService<Infrastructure.JobJack.Services.ExecutionStrategyService>()
        : scope.ServiceProvider.GetRequiredService<Infrastructure.IXO.PartnerSync.Services.ExecutionStrategyService>();

      using var transaction = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);
      await strategy.ExecuteInExecutionStrategyAsync(() => Task.CompletedTask, clearTrackedChanges: true);

      Assert.Single(context.ChangeTracker.Entries());
      Assert.Empty((jobJack ? (DbContext)jobJackContext : ixoContext).ChangeTracker.Entries());
      Assert.Single((jobJack ? (DbContext)ixoContext : jobJackContext).ChangeTracker.Entries());
    }
    [Fact]
    public async Task UmuziCleanupPreservesApplicationAndOtherProviderTracking()
    {
      using var provider = CreateProvider(true, true);
      using var scope = provider.CreateScope();
      var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
      context.Attach(new Opportunity { Id = Guid.NewGuid() });
      var ixoContext = scope.ServiceProvider.GetRequiredService<Infrastructure.IXO.PartnerSync.Context.IXOPartnerSyncDbContext>();
      ixoContext.Attach(new Infrastructure.IXO.PartnerSync.Entities.Opportunity { Id = Guid.NewGuid() });
      var umuziContext = scope.ServiceProvider.GetRequiredService<Infrastructure.Umuzi.Context.UmuziDbContext>();
      umuziContext.Attach(new Infrastructure.Umuzi.Entities.Opportunity { Id = Guid.NewGuid() });
      var strategy = scope.ServiceProvider.GetRequiredService<Infrastructure.Umuzi.Services.ExecutionStrategyService>();

      using var transaction = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);
      await strategy.ExecuteInExecutionStrategyAsync(() => Task.CompletedTask, clearTrackedChanges: true);

      Assert.Empty(umuziContext.ChangeTracker.Entries());
      Assert.Single(context.ChangeTracker.Entries());
      Assert.Single(ixoContext.ChangeTracker.Entries());
    }
    #endregion

    #region Private Members
    private static ServiceProvider CreateProvider(bool jobJack, bool ixo)
    {
      var services = new ServiceCollection();
      var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
      {
        ["ConnectionStrings:SQLConnection"] = "Host=127.0.0.1;Database=unused;Username=unused"
      }).Build();
      var settings = new AppSettings
      {
        DatabaseRetryPolicy = new AppSettingsDatabaseRetryPolicy { MaxRetryCount = 1, MaxRetryDelayInSeconds = 1 }
      };
      services.AddLogging();
      Infrastructure.Shared.Startup.ConfigureServices_InfrastructureShared(services);
      Infrastructure.Database.Startup.ConfigureServices_InfrastructureDatabase(services, configuration, settings);
      if (jobJack) Infrastructure.JobJack.Startup.ConfigureServices_InfrastructureSyncProvider(services, configuration, settings);
      if (ixo) Infrastructure.IXO.PartnerSync.Startup.ConfigureServices_InfrastructureSyncProvider(services, configuration, settings);
      Infrastructure.Umuzi.Startup.ConfigureServices_InfrastructureSyncProvider(services, configuration, settings);
      Infrastructure.Alison.Startup.ConfigureServices_InfrastructureSyncProvider(services, configuration, settings);
      Infrastructure.Jobberman.Startup.ConfigureServices_InfrastructureSyncProvider(services, configuration, settings);
      Infrastructure.Substack.Startup.ConfigureServices_InfrastructureNewsFeedProvider(services, configuration, settings);
      Infrastructure.AriesCloud.Startup.ConfigureServices_InfrastructureSSIProvider(services, configuration, settings);
      // Register didxme last, like the current API host. Neither SSI provider may replace the domain strategy.
      Infrastructure.DidxMe.Startup.ConfigureServices_InfrastructureSSIProvider(services, configuration, settings);
      return services.BuildServiceProvider(new ServiceProviderOptions { ValidateScopes = true });
    }
    #endregion
  }
}
