using Flurl.Http.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using System.Reflection;
using Xunit;
using Yoma.Core.Domain.ActionLink;
using Yoma.Core.Domain.ActionLink.Interfaces.Lookups;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.ActionLink.Services;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Notification;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Notification.Models;
using Yoma.Core.Domain.PartnerSync;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Domain.PartnerSync.Services;
using Yoma.Core.Domain.Payout.Interfaces;
using Yoma.Core.Domain.Payout.Models;
using Yoma.Core.Domain.Payout.Services;
using Yoma.Core.Domain.Reward;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Domain.Reward.Models;
using Yoma.Core.Domain.Reward.Services;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Domain.SSI.Services;
using RewardAwardRequest = Yoma.Core.Domain.Reward.Models.Provider.RewardAwardRequest;

namespace Yoma.Core.Test.Core
{
  public class BackgroundJobShutdownTests
  {
    #region Job Inventory
    public static TheoryData<string, string> Jobs
    {
      get
      {
        var assemblies = new[]
        {
          typeof(Domain.SSI.Services.SSIBackgroundService).Assembly,
          typeof(Infrastructure.Alison.Services.OpportunityCatalogueBackgroundService).Assembly,
          typeof(Infrastructure.IXO.PartnerSync.Services.OpportunityCatalogueBackgroundService).Assembly,
          typeof(Infrastructure.Jobberman.Services.OpportunityFeedBackgroundService).Assembly,
          typeof(Infrastructure.JobJack.Services.OpportunityFeedBackgroundService).Assembly,
          typeof(Infrastructure.Umuzi.Services.OpportunityCatalogueBackgroundService).Assembly,
          typeof(Infrastructure.Substack.Services.NewsFeedBackgroundService).Assembly
        };
        var types = assemblies.SelectMany(assembly => assembly.GetTypes())
          .Where(type => type.IsClass && !type.IsAbstract && type.Name.EndsWith("BackgroundService", StringComparison.Ordinal))
          .Append(typeof(Domain.Lookups.Services.SkillService));
        var result = new TheoryData<string, string>();
        foreach (var type in types.OrderBy(type => type.FullName))
          foreach (var method in type.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
            .Where(method => method.ReturnType == typeof(Task)
              && (type != typeof(Domain.Lookups.Services.SkillService) || method.Name == "SeedSkills")))
            result.Add(type.AssemblyQualifiedName!, method.Name);
        return result;
      }
    }
    #endregion Job Inventory

    #region Tests
    [Theory]
    [MemberData(nameof(Jobs))]
    public async Task AlreadyStoppingHostDoesNotAcquireALockOrStartBusinessWork(string typeName, string methodName)
    {
      using var fixture = new Fixture(typeName);
      fixture.Stopping.Cancel();

      await Assert.ThrowsAnyAsync<OperationCanceledException>(() => fixture.Run(methodName));

      fixture.Locks.Verify(service => service.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<string>()), Times.Never);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
      fixture.AssertNoBusinessWork();
    }

    [Theory]
    [MemberData(nameof(Jobs))]
    public async Task ShutdownImmediatelyAfterAcquisitionReleasesTheLockWithoutStartingWork(string typeName, string methodName)
    {
      using var fixture = new Fixture(typeName);
      fixture.Locks.Setup(service => service.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<string>()))
        .Callback(() => fixture.Stopping.Cancel()).ReturnsAsync(true);

      await Assert.ThrowsAnyAsync<OperationCanceledException>(() => fixture.Run(methodName));

      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
      fixture.AssertNoBusinessWork();
      fixture.Locks.Verify(service => service.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), methodName), Times.Once);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), methodName), Times.Once);
    }

    [Theory]
    [MemberData(nameof(Jobs))]
    public async Task LockHeldByAnotherWorkerIsNotReleasedAndDoesNotStartWork(string typeName, string methodName)
    {
      using var fixture = new Fixture(typeName);
      fixture.Locks.Setup(service => service.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<string>()))
        .ReturnsAsync(false);

      await fixture.Run(methodName);

      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
      fixture.AssertNoBusinessWork();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task DownloadLockTimeoutKeepsItsNormalHandlingUnlessTheHostIsStopping(bool stopping)
    {
      using var fixture = new Fixture(typeof(Domain.Core.Services.DownloadBackgroundService).AssemblyQualifiedName!);
      var cause = new Hangfire.Storage.DistributedLockTimeoutException("download-job");
      fixture.Locks.Setup(service => service.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<string>()))
        .Returns(() =>
        {
          if (stopping) fixture.Stopping.Cancel();
          return Task.FromException<bool>(cause);
        });

      if (stopping)
      {
        var result = await Assert.ThrowsAnyAsync<OperationCanceledException>(
          () => fixture.Run(nameof(Domain.Core.Services.DownloadBackgroundService.ProcessSchedule)));
        Assert.Same(cause, result.InnerException);
      }
      else
        await fixture.Run(nameof(Domain.Core.Services.DownloadBackgroundService.ProcessSchedule));

      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
      fixture.AssertNoBusinessWork();
    }

    [Fact]
    public async Task DownloadShutdownFinishesUploadPersistenceAndNotificationBeforeReleasingTheLock()
    {
      using var fixture = new Fixture(typeof(DownloadBackgroundService).AssemblyQualifiedName!);
      var (first, second, blob) = fixture.SetupDownloadWork();
      var notified = false;
      fixture.Get<INotificationDeliveryService>().Setup(service => service.Send(NotificationType.Download,
        It.IsAny<List<NotificationRecipient>>(), It.IsAny<NotificationDownload>()))
        .Callback(() =>
        {
          Assert.Equal(DownloadScheduleStatus.Processed, first.Status);
          Assert.Equal(blob.Id, first.FileId);
          notified = true;
        }).Returns(Task.CompletedTask);
      fixture.Locks.Setup(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()))
        .Callback(() => Assert.True(notified)).Returns(Task.CompletedTask);

      await Assert.ThrowsAnyAsync<OperationCanceledException>(() => fixture.Run(nameof(DownloadBackgroundService.ProcessSchedule)));

      Assert.True(notified);
      Assert.Equal(DownloadScheduleStatus.Pending, second.Status);
      fixture.Get<IDownloadService>().Verify(service => service.UpdateSchedule(first), Times.Once);
      fixture.Get<IOpportunityInfoService>().Verify(service => service.ExportToCSV(
        It.IsAny<OpportunitySearchFilterAdmin>(), false, true), Times.Once);
      fixture.Get<IBlobService>().Verify(service => service.Delete(It.IsAny<Guid>()), Times.Never);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task DownloadShutdownStillRollsBackUploadedBlobWhenSchedulePersistenceFails()
    {
      using var fixture = new Fixture(typeof(DownloadBackgroundService).AssemblyQualifiedName!);
      var (first, second, blob) = fixture.SetupDownloadWork();
      var cause = new ObjectDisposedException("Schedule store");
      fixture.Get<IDownloadService>().Setup(service => service.UpdateSchedule(first)).ThrowsAsync(cause);
      var rolledBack = false;
      fixture.Get<IBlobService>().Setup(service => service.Delete(blob.Id))
        .Callback(() => rolledBack = true).Returns(Task.CompletedTask);
      fixture.Locks.Setup(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()))
        .Callback(() => Assert.True(rolledBack)).Returns(Task.CompletedTask);

      var result = await Assert.ThrowsAnyAsync<OperationCanceledException>(() => fixture.Run(nameof(DownloadBackgroundService.ProcessSchedule)));

      Assert.Same(cause, result.InnerException);
      Assert.True(rolledBack);
      Assert.Equal(DownloadScheduleStatus.Pending, second.Status);
      fixture.Get<IBlobService>().Verify(service => service.Delete(blob.Id), Times.Once);
      fixture.Get<INotificationDeliveryService>().Verify(service => service.Send(NotificationType.Download,
        It.IsAny<List<NotificationRecipient>>(), It.IsAny<NotificationDownload>()), Times.Never);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task PayoutShutdownFinishesTheCurrentReconciliationBeforeReleasingTheLock()
    {
      using var fixture = new Fixture(typeof(PayoutBackgroundService).AssemblyQualifiedName!);
      var payouts = fixture.Get<IPayoutService>();
      var first = new PayoutTransaction { Id = Guid.NewGuid() };
      var second = new PayoutTransaction { Id = Guid.NewGuid() };
      payouts.Setup(service => service.ListForReconciliation(It.IsAny<int>(), It.IsAny<List<Guid>>())).Returns([first, second]);
      var entered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
      var finish = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
      var completed = false;
      payouts.Setup(service => service.Reconcile(first.Id)).Returns(async () =>
      {
        entered.SetResult();
        await finish.Task;
        completed = true;
      });

      var run = fixture.Run(nameof(PayoutBackgroundService.ProcessReconciliation));
      await entered.Task.WaitAsync(TimeSpan.FromSeconds(10), TestContext.Current.CancellationToken);
      fixture.Stopping.Cancel();
      Assert.False(run.IsCompleted);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
      finish.SetResult();
      await Assert.ThrowsAnyAsync<OperationCanceledException>(() => run.WaitAsync(TimeSpan.FromSeconds(10), TestContext.Current.CancellationToken));

      Assert.True(completed);
      payouts.Verify(service => service.Reconcile(first.Id), Times.Once);
      payouts.Verify(service => service.Reconcile(second.Id), Times.Never);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task OrdinaryPayoutErrorsRetainTheExistingContinueToNextItemBehaviour()
    {
      using var fixture = new Fixture(typeof(PayoutBackgroundService).AssemblyQualifiedName!);
      var payouts = fixture.Get<IPayoutService>();
      var first = new PayoutTransaction { Id = Guid.NewGuid() };
      var second = new PayoutTransaction { Id = Guid.NewGuid() };
      payouts.Setup(service => service.ListForReconciliation(It.IsAny<int>(), It.IsAny<List<Guid>>()))
        .Returns((int _, List<Guid> skipped) => [.. new[] { first, second }.Where(item => !skipped.Contains(item.Id))]);
      payouts.Setup(service => service.Reconcile(first.Id)).ThrowsAsync(new InvalidOperationException("Provider unavailable"));

      await fixture.Run(nameof(PayoutBackgroundService.ProcessReconciliation));

      payouts.Verify(service => service.Reconcile(first.Id), Times.Once);
      payouts.Verify(service => service.Reconcile(second.Id), Times.Once);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task TenantShutdownPersistsProviderSuccessAndDrainsBeforeReleasingTheLock()
    {
      using var fixture = new Fixture(typeof(SSIBackgroundService).AssemblyQualifiedName!);
      var items = fixture.SetupTenantWork(3);
      var provider = fixture.Get<ISSIProviderClient>();
      var entered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
      var finish = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);
      provider.Setup(service => service.EnsureTenant(It.IsAny<TenantRequest>())).Returns(() =>
      {
        entered.SetResult();
        return finish.Task;
      });

      var run = fixture.Run(nameof(SSIBackgroundService.ProcessTenantCreation));
      await entered.Task.WaitAsync(TimeSpan.FromSeconds(10), TestContext.Current.CancellationToken);
      fixture.Stopping.Cancel();
      Assert.False(run.IsCompleted);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
      finish.SetResult("created-tenant");
      await Assert.ThrowsAnyAsync<OperationCanceledException>(() => run);

      Assert.Equal(TenantCreationStatus.Created, items[0].Status);
      Assert.Equal("created-tenant", items[0].TenantId);
      Assert.All(items.Skip(1), item => Assert.Equal(TenantCreationStatus.Pending, item.Status));
      fixture.Get<ISSITenantService>().Verify(service => service.UpdateScheduleCreation(items[0]), Times.Once);
      provider.Verify(service => service.EnsureTenant(It.IsAny<TenantRequest>()), Times.Once);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task TenantWorkerSetupFailureCannotLeakASlotOrHangTheProducer(bool failResolution)
    {
      using var fixture = new Fixture(typeof(SSIBackgroundService).AssemblyQualifiedName!);
      var items = fixture.SetupTenantWork(8);
      var factory = fixture.Get<Microsoft.Extensions.DependencyInjection.IServiceScopeFactory>();
      if (failResolution)
      {
        var provider = new Mock<IServiceProvider>();
        provider.Setup(service => service.GetService(It.IsAny<Type>())).Throws(new ObjectDisposedException("worker provider"));
        var scope = new Mock<Microsoft.Extensions.DependencyInjection.IServiceScope>();
        scope.SetupGet(value => value.ServiceProvider).Returns(provider.Object);
        factory.Setup(service => service.CreateScope()).Returns(scope.Object);
      }
      else factory.Setup(service => service.CreateScope()).Throws(new ObjectDisposedException("scope factory"));

      await Assert.ThrowsAnyAsync<Exception>(() => fixture.Run(nameof(SSIBackgroundService.ProcessTenantCreation)));

      Assert.All(items, item => Assert.Equal(TenantCreationStatus.Pending, item.Status));
      fixture.Get<ISSITenantService>().Verify(service => service.UpdateScheduleCreation(It.IsAny<SSITenantCreation>()), Times.Never);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task OrdinaryTenantProviderFailureKeepsErrorHandlingAndContinuesTheBatch()
    {
      using var fixture = new Fixture(typeof(SSIBackgroundService).AssemblyQualifiedName!);
      var items = fixture.SetupTenantWork(2);
      fixture.Get<ISSIProviderClient>().SetupSequence(service => service.EnsureTenant(It.IsAny<TenantRequest>()))
        .ThrowsAsync(new InvalidOperationException("Provider unavailable"))
        .ReturnsAsync("second-tenant");

      await fixture.Run(nameof(SSIBackgroundService.ProcessTenantCreation));

      Assert.Equal(TenantCreationStatus.Error, items[0].Status);
      Assert.Equal("Provider unavailable", items[0].ErrorReason);
      Assert.Equal(TenantCreationStatus.Created, items[1].Status);
      Assert.Equal("second-tenant", items[1].TenantId);
      fixture.Get<ISSITenantService>().Verify(service => service.UpdateScheduleCreation(It.IsAny<SSITenantCreation>()), Times.Exactly(2));
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task WalletShutdownPersistsACompletedUsernameUpdateBeforeStopping()
    {
      using var fixture = new Fixture(typeof(RewardBackgroundService).AssemblyQualifiedName!);
      var first = new WalletCreation { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), Status = WalletCreationStatus.PendingUsernameUpdate };
      var second = new WalletCreation { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), Status = WalletCreationStatus.Pending };
      var wallets = fixture.Get<IWalletService>();
      wallets.Setup(service => service.ListPendingCreationSchedule(It.IsAny<int>(), It.IsAny<List<Guid>>()))
        .Returns((int _, List<Guid> skip) => [.. new[] { first, second }.Where(item => !skip.Contains(item.Id)
          && item.Status != WalletCreationStatus.Created)]);
      wallets.Setup(service => service.UpdateWalletUsername(first.UserId)).Returns(() =>
      {
        fixture.Stopping.Cancel();
        return Task.FromResult("updated-user");
      });

      await Assert.ThrowsAnyAsync<OperationCanceledException>(() => fixture.Run(nameof(RewardBackgroundService.ProcessWalletCreation)));

      Assert.Equal(WalletCreationStatus.Created, first.Status);
      Assert.Equal("updated-user", first.Username);
      wallets.Verify(service => service.UpdateScheduleCreation(first, WalletCreationStatus.PendingUsernameUpdate), Times.Once);
      wallets.Verify(service => service.CreateWallet(second.UserId), Times.Never);
      Assert.Equal(WalletCreationStatus.Pending, second.Status);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task RewardShutdownPersistsAnAwardBeforeStoppingTheNextTransaction()
    {
      using var fixture = new Fixture(typeof(RewardBackgroundService).AssemblyQualifiedName!);
      var items = Enumerable.Range(0, 2).Select(_ => new RewardTransaction
      {
        Id = Guid.NewGuid(),
        UserId = Guid.NewGuid(),
        SourceEntityType = RewardTransactionEntityType.MyOpportunity.ToString(),
        MyOpportunityId = Guid.NewGuid(),
        Status = RewardTransactionStatus.Pending
      }).ToList();
      fixture.Get<IRewardService>().Setup(service => service.ListPendingTransactionSchedule(It.IsAny<int>(), It.IsAny<List<Guid>>()))
        .Returns((int _, List<Guid> skip) => [.. items.Where(item => !skip.Contains(item.Id) && item.Status == RewardTransactionStatus.Pending)]);
      fixture.Get<IWalletService>().Setup(service => service.GetWalletIdOrNull(It.IsAny<Guid>())).Returns(("test-user", "test-wallet"));
      fixture.Get<Domain.MyOpportunity.Interfaces.IMyOpportunityService>()
        .Setup(service => service.GetById(It.IsAny<Guid>(), false, false, false))
        .Returns(new Domain.MyOpportunity.Models.MyOpportunity { Id = items[0].MyOpportunityId!.Value, OpportunityId = Guid.NewGuid() });
      fixture.Get<Domain.Opportunity.Interfaces.IOpportunityService>()
        .Setup(service => service.GetById(It.IsAny<Guid>(), true, false, false)).Returns(new Opportunity());
      Mock.Get(fixture.Get<Domain.Reward.Interfaces.Provider.IRewardProviderClientFactory>().Object.CreateClient())
        .Setup(service => service.RewardEarn(It.IsAny<RewardAwardRequest>())).Returns(() =>
        {
          fixture.Stopping.Cancel();
          return Task.FromResult("award-id");
        });

      await Assert.ThrowsAnyAsync<OperationCanceledException>(() => fixture.Run(nameof(RewardBackgroundService.ProcessRewardTransactions)));

      Assert.Equal(RewardTransactionStatus.Processed, items[0].Status);
      Assert.Equal("award-id", items[0].TransactionId);
      Assert.Equal(RewardTransactionStatus.Pending, items[1].Status);
      fixture.Get<IRewardService>().Verify(service => service.UpdateTransaction(items[0]), Times.Once);
      fixture.Get<IRewardService>().Verify(service => service.UpdateTransaction(items[1]), Times.Never);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Theory]
    [InlineData(SyncScope.Entity)]
    [InlineData(SyncScope.Verification)]
    public async Task InterruptedSyncFetchRecordsRunFailureWithoutACompletedCheckpoint(SyncScope syncScope)
    {
      using var fixture = new Fixture(typeof(SyncBackgroundService).AssemblyQualifiedName!);
      var partner = new Domain.PartnerSync.Models.Lookups.Partner
      {
        Id = Guid.NewGuid(),
        Name = SyncPartner.IXO.ToString(),
        SyncCapabilitiesParsed = new() { [SyncType.Pull] = new() { [Domain.PartnerSync.EntityType.Opportunity] = [syncScope] } }
      };
      fixture.Get<IPartnerService>().Setup(service => service.ListPull(syncScope, null, It.IsAny<Domain.PartnerSync.EntityType?>())).Returns([partner]);
      if (syncScope == SyncScope.Entity)
      {
        var provider = fixture.Get<ISyncProviderClientPullEntity<OpportunityRequestCreate>>();
        fixture.Get<ISyncProviderClientFactoryResolver>().Setup(service => service.CreateClient<ISyncProviderClientPullEntity<OpportunityRequestCreate>>(SyncPartner.IXO)).Returns(provider.Object);
        provider.Setup(service => service.List(It.IsAny<SyncFilterPullEntity>())).Returns(() =>
        {
          fixture.Stopping.Cancel();
          return Task.FromResult(new SyncResultPullEntity<OpportunityRequestCreate>
          {
            TotalCount = 1,
            Items = [new() { ExternalId = "course", Item = new OpportunityRequestCreate() }]
          });
        });
      }
      else
      {
        var provider = fixture.Get<ISyncProviderClientPullVerification>();
        fixture.Get<ISyncProviderClientFactoryResolver>().Setup(service => service.CreateClient<ISyncProviderClientPullVerification>(SyncPartner.IXO)).Returns(provider.Object);
        provider.Setup(service => service.List(It.IsAny<SyncFilterPullVerification>())).Returns(() =>
        {
          fixture.Stopping.Cancel();
          return Task.FromResult(new SyncResultPullVerification
          {
            TotalCount = 1,
            Items = [new() { EntityExternalId = "course", UserExternalId = "youth" }]
          });
        });
      }
      PartnerSyncTrackingRequest? tracking = null;
      fixture.Get<IProcessingService>().Setup(service => service.RecordTracking(It.IsAny<PartnerSyncTrackingRequest>()))
        .Callback<PartnerSyncTrackingRequest>(value => tracking = value).Returns(Task.CompletedTask);

      await Assert.ThrowsAnyAsync<OperationCanceledException>(() => fixture.Run(syncScope == SyncScope.Entity
        ? nameof(SyncBackgroundService.ProcessSyncPull) : nameof(SyncBackgroundService.ProcessSyncPullVerification)));

      Assert.NotNull(tracking);
      Assert.NotEmpty(tracking.RunFailureReason!);
      Assert.Null(tracking.ItemsProcessed);
      fixture.Get<IProcessingService>().Verify(service => service.GetPull(It.IsAny<Guid>(), It.IsAny<Domain.PartnerSync.EntityType>(), It.IsAny<string>()), Times.Never);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task InterruptedCatalogueFetchNeverPublishesAPartialSnapshot()
    {
      using var http = new HttpTest();
      using var fixture = new Fixture(typeof(Infrastructure.IXO.PartnerSync.Services.OpportunityCatalogueBackgroundService).AssemblyQualifiedName!);
      fixture.Get<IEnvironmentProvider>().SetupGet(value => value.Environment).Returns(Domain.Core.Environment.Local);
      fixture.Options<AppSettings>().PartnerSyncEnabledEnvironments[SyncPartner.IXO.ToString()] = "Local";
      var options = fixture.Options<Infrastructure.IXO.PartnerSync.Models.IXOPartnerSyncOptions>();
      options.BaseUrl = "https://shutdown-test.invalid";
      options.OpportunitiesPath = "opportunities";
      options.RequestTimeoutSeconds = 5;
      fixture.Get<Infrastructure.IXO.PartnerSync.Interfaces.IIXOAuthService>().Setup(service => service.GetAuthHeader())
        .Callback(() => fixture.Stopping.Cancel()).ReturnsAsync(new KeyValuePair<string, string>("Authorization", "Bearer local-test"));
      http.RespondWithJson(new Infrastructure.IXO.PartnerSync.Models.PageResponse<Infrastructure.IXO.PartnerSync.Models.OpportunityResponse>
      {
        Page = 1,
        PageSize = 1,
        TotalPages = 2,
        Items = [new() { ExternalId = "first" }]
      });

      await Assert.ThrowsAnyAsync<OperationCanceledException>(() => fixture.Run("RefreshCatalogue"));

      Assert.Single(http.CallLog);
      Assert.Empty(fixture.Get<IRepositoryBatched<Infrastructure.IXO.PartnerSync.Models.Opportunity>>().Invocations);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task BatchShutdownCompletesTheCurrentBatchWithoutStartingTheNext()
    {
      using var fixture = new Fixture(typeof(LinkServiceBackgroundService).AssemblyQualifiedName!);
      var activeId = Guid.NewGuid();
      var expiredId = Guid.NewGuid();
      fixture.Get<ILinkStatusService>().Setup(service => service.GetByName(ActionLinkStatus.Active.ToString()))
        .Returns(new Domain.ActionLink.Models.Lookups.LinkStatus { Id = activeId });
      fixture.Get<ILinkStatusService>().Setup(service => service.GetByName(ActionLinkStatus.Expired.ToString()))
        .Returns(new Domain.ActionLink.Models.Lookups.LinkStatus { Id = expiredId });
      fixture.Get<IUserService>().Setup(service => service.GetByUsername(It.IsAny<string>(), false, false)).Returns(new User { Id = Guid.NewGuid() });
      var items = Enumerable.Range(0, 4).Select(_ => new Link
      {
        Id = Guid.NewGuid(),
        StatusId = activeId,
        DateEnd = DateTimeOffset.UtcNow.AddDays(-1)
      }).ToList();
      var repository = fixture.Get<IRepositoryBatchedValueContainsWithUnnested<Link>>();
      repository.Setup(service => service.Query()).Returns(() => items.AsQueryable());
      repository.Setup(service => service.Update(It.IsAny<List<Link>>())).ReturnsAsync((List<Link> batch) =>
      {
        fixture.Stopping.Cancel();
        return batch;
      });

      await Assert.ThrowsAnyAsync<OperationCanceledException>(() => fixture.Run(nameof(LinkServiceBackgroundService.ProcessExpiration)));

      Assert.Equal(2, items.Count(item => item.StatusId == expiredId));
      Assert.Equal(2, items.Count(item => item.StatusId == activeId));
      repository.Verify(service => service.Update(It.IsAny<List<Link>>()), Times.Once);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(5)]
    public async Task TenantWorkersRemainBoundedAndFinishAllSuccessfulUnits(int parallelism)
    {
      using var fixture = new Fixture(typeof(SSIBackgroundService).AssemblyQualifiedName!);
      var items = fixture.SetupTenantWork(25);
      fixture.Options<AppSettings>().SSIParallelism.TenantCreation = parallelism;
      fixture.Options<ScheduleJobOptions>().SSITenantCreationScheduleBatchSize = 10;
      var active = 0;
      var maximum = 0;
      var entered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
      var finish = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
      fixture.Get<ISSIProviderClient>().Setup(service => service.EnsureTenant(It.IsAny<TenantRequest>()))
        .Returns(async (TenantRequest request) =>
        {
          var current = Interlocked.Increment(ref active);
          int observed;
          do { observed = Volatile.Read(ref maximum); }
          while (current > observed && Interlocked.CompareExchange(ref maximum, current, observed) != observed);
          if (current == parallelism) entered.TrySetResult();
          await finish.Task;
          Interlocked.Decrement(ref active);
          return request.Referent;
        });

      var run = fixture.Run(nameof(SSIBackgroundService.ProcessTenantCreation));
      await entered.Task.WaitAsync(TimeSpan.FromSeconds(10), TestContext.Current.CancellationToken);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
      finish.SetResult();
      await run;

      Assert.Equal(parallelism, maximum);
      Assert.Equal(0, active);
      Assert.All(items, item => Assert.Equal(TenantCreationStatus.Created, item.Status));
      fixture.Get<ISSIProviderClient>().Verify(service => service.EnsureTenant(It.IsAny<TenantRequest>()), Times.Exactly(25));
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task OrganizationDocumentPassFinishesAllRequiredKindsOnceRegistrationIsSaved()
    {
      using var fixture = new Fixture(typeof(Domain.Entity.Services.OrganizationBackgroundService).AssemblyQualifiedName!);
      fixture.Get<IEnvironmentProvider>().SetupGet(value => value.Environment).Returns(Domain.Core.Environment.Local);
      fixture.Options<AppSettings>().TestDataSeedingEnvironments = "Local";
      var organization = new Organization
      {
        Id = Guid.NewGuid(),
        LogoId = Guid.NewGuid(),
        ProviderTypes =
        [
          new() { Name = Domain.Entity.OrganizationProviderType.Education.ToString() },
          new() { Name = Domain.Entity.OrganizationProviderType.Marketplace.ToString() }
        ]
      };
      fixture.Get<IRepositoryBatchedValueContainsWithNavigationAndTrackingTotals<Organization>>().Setup(service => service.Query(true))
        .Returns(new[] { organization }.AsQueryable());
      fixture.Get<IRepository<OrganizationDocument>>().Setup(service => service.Query()).Returns(Array.Empty<OrganizationDocument>().AsQueryable());
      var captured = new List<OrganizationDocumentType>();
      fixture.Get<IOrganizationService>().Setup(service => service.AddDocuments(organization.Id, It.IsAny<OrganizationDocumentType>(),
        It.IsAny<List<Microsoft.AspNetCore.Http.IFormFile>>(), false))
        .Returns((Guid _, OrganizationDocumentType type, List<Microsoft.AspNetCore.Http.IFormFile> _, bool _) =>
        {
          captured.Add(type);
          fixture.Stopping.Cancel();
          return Task.FromResult(organization);
        });

      await fixture.Run(nameof(Domain.Entity.Services.OrganizationBackgroundService.SeedLogoAndDocuments));

      Assert.Equal([OrganizationDocumentType.Registration, OrganizationDocumentType.EducationProvider, OrganizationDocumentType.Business], captured);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task SkillCacheCleanupFailureStillReleasesTheLockAfterASavedBatch()
    {
      using var fixture = new Fixture(typeof(Domain.Lookups.Services.SkillService).AssemblyQualifiedName!);
      fixture.Options<AppSettings>().CacheEnabledByCacheItemTypes = CacheItemType.Lookups.ToString();
      Mock.Get(fixture.Get<Domain.LaborMarketProvider.Interfaces.ILaborMarketProviderClientFactory>().Object.CreateClient()).Setup(service => service.ListSkills())
        .ReturnsAsync([new() { Id = "skill", Name = "Test Skill" }]);
      var repository = fixture.Get<IRepositoryBatchedValueContains<Domain.Lookups.Models.Skill>>();
      repository.Setup(service => service.Query()).Returns(Array.Empty<Domain.Lookups.Models.Skill>().AsQueryable());
      repository.Setup(service => service.Create(It.IsAny<List<Domain.Lookups.Models.Skill>>()))
        .ReturnsAsync((List<Domain.Lookups.Models.Skill> items) => items);
      fixture.Get<Microsoft.Extensions.Caching.Memory.IMemoryCache>().Setup(service => service.Remove(It.IsAny<object>()))
        .Throws(new ObjectDisposedException("memory cache"));

      await Assert.ThrowsAsync<ObjectDisposedException>(() => fixture.Run(nameof(Domain.Lookups.Services.SkillService.SeedSkills)));

      repository.Verify(service => service.Create(It.IsAny<List<Domain.Lookups.Models.Skill>>()), Times.Once);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task SyncTrackingFailureDuringShutdownStillReleasesThePushLock()
    {
      using var fixture = new Fixture(typeof(SyncBackgroundService).AssemblyQualifiedName!);
      fixture.Get<IOrganizationService>().Setup(service => service.GetByNameOrNull(It.IsAny<string>(), true, true)).Returns(new Organization());
      var processing = fixture.Get<IProcessingService>();
      processing.Setup(service => service.ListPendingPush(It.IsAny<int>(), It.IsAny<List<Guid>>()))
        .Returns([(Guid.NewGuid(), Domain.PartnerSync.EntityType.Opportunity, new List<ProcessingLog> { new() { Id = Guid.NewGuid() } })]);
      processing.Setup(service => service.UpdatePush(It.IsAny<ProcessingLog>()))
        .Callback(() => fixture.Stopping.Cancel()).Returns(Task.CompletedTask);
      PartnerSyncTrackingRequest? tracking = null;
      processing.Setup(service => service.RecordTracking(It.IsAny<PartnerSyncTrackingRequest>()))
        .Callback<PartnerSyncTrackingRequest>(value => tracking = value).ThrowsAsync(new ObjectDisposedException("tracking store"));

      await Assert.ThrowsAsync<ObjectDisposedException>(() => fixture.Run(nameof(SyncBackgroundService.ProcessSyncPush)));

      Assert.NotNull(tracking);
      Assert.NotEmpty(tracking.RunFailureReason!);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task SyncShutdownAfterCreatePersistsTheMappingButDoesNotAdvanceTheCheckpoint()
    {
      using var fixture = new Fixture(typeof(SyncBackgroundService).AssemblyQualifiedName!);
      var partner = new Domain.PartnerSync.Models.Lookups.Partner
      {
        Id = Guid.NewGuid(),
        Name = SyncPartner.IXO.ToString(),
        ActionsEnabledParsed = [SyncAction.Create],
        SyncCapabilitiesParsed = new() { [SyncType.Pull] = new() { [Domain.PartnerSync.EntityType.Opportunity] = [SyncScope.Entity] } }
      };
      fixture.Get<IPartnerService>().Setup(service => service.ListPull(SyncScope.Entity, null, null)).Returns([partner]);
      var provider = fixture.Get<ISyncProviderClientPullEntity<OpportunityRequestCreate>>();
      fixture.Get<ISyncProviderClientFactoryResolver>().Setup(service => service.CreateClient<ISyncProviderClientPullEntity<OpportunityRequestCreate>>(SyncPartner.IXO)).Returns(provider.Object);
      provider.Setup(service => service.List(It.IsAny<SyncFilterPullEntity>())).ReturnsAsync(new SyncResultPullEntity<OpportunityRequestCreate>
      {
        TotalCount = 2,
        Items =
        [
          new() { ExternalId = "first", Item = new OpportunityRequestCreate { Title = "First", Categories = [], Countries = [], Languages = [] } },
          new() { ExternalId = "second", Item = new OpportunityRequestCreate { Title = "Second", Categories = [], Countries = [], Languages = [] } }
        ]
      });
      fixture.Get<IProcessingService>().Setup(service => service.GetPull(It.IsAny<Guid>(), It.IsAny<Domain.PartnerSync.EntityType>(), It.IsAny<string>()))
        .Returns((ProcessingLog?)null);
      fixture.Get<IExecutionStrategyService>().Setup(service => service.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>(), false))
        .Returns((Func<Task> body, bool _) => body());
      var createdId = Guid.NewGuid();
      fixture.Get<Domain.Opportunity.Interfaces.IOpportunityService>()
        .Setup(service => service.Create(It.IsAny<OpportunityRequestCreate>(), It.IsAny<OpportunityUpsertOptions>()))
        .Callback(() => fixture.Stopping.Cancel()).ReturnsAsync(new Opportunity { Id = createdId });
      PartnerSyncTrackingRequest? tracking = null;
      fixture.Get<IProcessingService>().Setup(service => service.RecordTracking(It.IsAny<PartnerSyncTrackingRequest>()))
        .Callback<PartnerSyncTrackingRequest>(value => tracking = value).Returns(Task.CompletedTask);

      await Assert.ThrowsAnyAsync<OperationCanceledException>(() => fixture.Run(nameof(SyncBackgroundService.ProcessSyncPull)));

      Assert.NotNull(tracking);
      Assert.True(tracking.ItemsSucceeded == 1, $"Expected one completed item; run failure: {tracking.RunFailureReason}");
      fixture.Get<IProcessingService>().Verify(service => service.RecordPull(SyncAction.Create, partner.Id,
        Domain.PartnerSync.EntityType.Opportunity, "first", createdId, It.IsAny<string>()), Times.Once);
      fixture.Get<Domain.Opportunity.Interfaces.IOpportunityService>().Verify(service => service.Create(It.IsAny<OpportunityRequestCreate>(), It.IsAny<OpportunityUpsertOptions>()), Times.Once);
      Assert.Equal(1, tracking.ItemsSucceeded);
      Assert.NotEmpty(tracking.RunFailureReason!);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }
    #endregion Tests

    #region Fixture
    private sealed class Fixture : IDisposable
    {
      private readonly Dictionary<Type, Mock> _mocks = [];
      private readonly Dictionary<Type, object> _options = [];
      private readonly List<IDisposable> _disposables = [];
      private readonly object _service;
      public CancellationTokenSource Stopping { get; } = new();
      public Mock<IDistributedLockService> Locks { get; } = new();

      public Fixture(string typeName)
      {
        var lifetime = new Mock<IHostApplicationLifetime>();
        lifetime.SetupGet(value => value.ApplicationStopping).Returns(Stopping.Token);
        _mocks.Add(typeof(IHostApplicationLifetime), lifetime);
        _mocks.Add(typeof(IDistributedLockService), Locks);
        Locks.Setup(service => service.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<string>())).ReturnsAsync(true);
        _service = Resolve(Type.GetType(typeName, throwOnError: true)!);
        foreach (var mock in _mocks.Values) mock.Invocations.Clear();
      }

      public Mock<T> Get<T>() where T : class
      {
        Resolve(typeof(T));
        return (Mock<T>)_mocks[typeof(T)];
      }

      public T Options<T>() where T : class => (T)_options[typeof(T)];

      public (DownloadSchedule First, DownloadSchedule Second, BlobObject Blob) SetupDownloadWork()
      {
        var first = new DownloadSchedule
        {
          Id = Guid.NewGuid(),
          UserId = Guid.NewGuid(),
          Type = DownloadScheduleType.Opportunities.ToString(),
          Filter = "{}",
          Status = DownloadScheduleStatus.Pending
        };
        var second = new DownloadSchedule
        {
          Id = Guid.NewGuid(),
          UserId = first.UserId,
          Type = first.Type,
          Filter = first.Filter,
          Status = DownloadScheduleStatus.Pending
        };
        var blob = new BlobObject
        {
          Id = Guid.NewGuid(),
          StorageType = Domain.BlobProvider.StorageType.Private,
          Key = "download.zip",
          OriginalFileName = "Download.zip"
        };
        Get<IDownloadService>().Setup(service => service.ListPendingSchedule(It.IsAny<int>(), It.IsAny<List<Guid>>())).Returns([first, second]);
        Get<IOpportunityInfoService>().Setup(service => service.ExportToCSV(It.IsAny<OpportunitySearchFilterAdmin>(), false, true))
          .Returns(("opportunities.csv", System.Text.Encoding.UTF8.GetBytes("Title\nTest opportunity\n")));
        Get<IBlobService>().Setup(service => service.Create(FileType.ZipArchive, Domain.BlobProvider.StorageType.Private,
          It.IsAny<Microsoft.AspNetCore.Http.IFormFile>(), null))
          .Callback(() => Stopping.Cancel()).ReturnsAsync(blob);
        Get<IUserService>().Setup(service => service.GetById(first.UserId, false, false))
          .Returns(new User { Id = first.UserId, Username = "test-youth", DisplayName = "Test Youth" });
        return (first, second, blob);
      }

      public List<SSITenantCreation> SetupTenantWork(int count)
      {
        Options<AppSettings>().SSIEnabledEnvironments = "Local";
        Options<AppSettings>().SSIParallelism = new AppSettingsSSIParallelism { TenantCreation = 1, CredentialIssuance = 1 };
        Get<IEnvironmentProvider>().SetupGet(value => value.Environment).Returns(Domain.Core.Environment.Local);
        var items = Enumerable.Range(0, count).Select(_ => new SSITenantCreation
        {
          Id = Guid.NewGuid(),
          UserId = Guid.NewGuid(),
          EntityType = Domain.Entity.EntityType.User.ToString(),
          Status = TenantCreationStatus.Pending
        }).ToList();
        Get<ISSITenantService>().Setup(service => service.ListPendingCreationSchedule(It.IsAny<int>(), It.IsAny<List<Guid>>()))
          .Returns((int size, List<Guid> skip) => [.. items.Where(item => item.Status == TenantCreationStatus.Pending && !skip.Contains(item.Id)).Take(size)]);
        Get<IUserService>().Setup(service => service.GetById(It.IsAny<Guid>(), false, true))
          .Returns((Guid id, bool _, bool _) => new User { Id = id, Username = "test-youth", DisplayName = "Test Youth" });
        Get<IOrganizationService>();
        Get<ISSIProviderClientFactory>().Setup(service => service.CreateClient()).Returns(Get<ISSIProviderClient>().Object);
        Get<Microsoft.Extensions.DependencyInjection.IServiceScopeFactory>().Setup(service => service.CreateScope()).Returns(() =>
        {
          var provider = new Mock<IServiceProvider>();
          provider.Setup(service => service.GetService(It.IsAny<Type>())).Returns((Type type) => Resolve(type));
          var scope = new Mock<Microsoft.Extensions.DependencyInjection.IServiceScope>();
          scope.SetupGet(value => value.ServiceProvider).Returns(provider.Object);
          return scope.Object;
        });
        return items;
      }

      public Task Run(string methodName)
      {
        var method = _service.GetType().GetMethod(methodName)!;
        var args = method.GetParameters().Select(parameter => parameter.ParameterType == typeof(bool)
          ? (object)false : throw new NotSupportedException($"Job parameter '{parameter.Name}' is unsupported")).ToArray();
        return Task.Run(async () => await (Task)method.Invoke(_service, args)!, TestContext.Current.CancellationToken)
          .WaitAsync(TimeSpan.FromSeconds(10), TestContext.Current.CancellationToken);
      }

      public void AssertNoBusinessWork()
      {
        foreach (var pair in _mocks.Where(pair => pair.Key != typeof(IHostApplicationLifetime) && pair.Key != typeof(IDistributedLockService)))
          Assert.Empty(pair.Value.Invocations);
      }

      private object Resolve(Type type)
      {
        if (_mocks.TryGetValue(type, out var existing)) return existing.Object;
        if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(ILogger<>))
          return Activator.CreateInstance(typeof(NullLogger<>).MakeGenericType(type.GenericTypeArguments))!;
        if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(IOptions<>))
        {
          var valueType = type.GenericTypeArguments[0];
          var value = Activator.CreateInstance(valueType)!;
          _options[valueType] = value;
          if (value is ScheduleJobOptions schedule)
          {
            foreach (var property in typeof(ScheduleJobOptions).GetProperties().Where(property => property.PropertyType == typeof(int)
              && (property.Name.Contains("MaxIntervalInHours", StringComparison.Ordinal) || property.Name.EndsWith("BatchSize", StringComparison.Ordinal))))
              property.SetValue(schedule, 2);
          }
          return Activator.CreateInstance(typeof(OptionsWrapper<>).MakeGenericType(valueType), value)!;
        }
        if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(DbContextOptions<>))
        {
          var builder = Activator.CreateInstance(typeof(DbContextOptionsBuilder<>).MakeGenericType(type.GenericTypeArguments))!;
          return builder.GetType().GetProperty("Options", BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)!.GetValue(builder)!;
        }
        if (type.IsInterface)
        {
          var mock = (Mock)Activator.CreateInstance(typeof(Mock<>).MakeGenericType(type))!;
          mock.DefaultValue = DefaultValue.Mock;
          _mocks.Add(type, mock);
          return mock.Object;
        }
        var constructor = type.GetConstructors().Single();
        var result = constructor.Invoke([.. constructor.GetParameters().Select(parameter => Resolve(parameter.ParameterType))]);
        if (result is IDisposable disposable) _disposables.Add(disposable);
        return result;
      }

      public void Dispose()
      {
        foreach (var disposable in _disposables.AsEnumerable().Reverse()) disposable.Dispose();
        Stopping.Dispose();
      }
    }
    #endregion Fixture
  }
}

