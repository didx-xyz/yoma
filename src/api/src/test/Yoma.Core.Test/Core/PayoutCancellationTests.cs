using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Payout;
using Yoma.Core.Domain.Payout.Extensions;
using Yoma.Core.Domain.Payout.Interfaces;
using Yoma.Core.Domain.Payout.Interfaces.Lookups;
using Yoma.Core.Domain.Payout.Interfaces.Provider;
using Yoma.Core.Domain.Payout.Models;
using Yoma.Core.Domain.Payout.Models.Provider;
using Yoma.Core.Domain.Payout.Services;
using Yoma.Core.Domain.Payout.Validators;
using Yoma.Core.Domain.Reward;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Domain.Reward.Interfaces.Provider;
using Yoma.Core.Domain.Reward.Models;
using Yoma.Core.Domain.Reward.Models.Provider;
using Yoma.Core.Domain.Treasury.Interfaces;
using Provider = Yoma.Core.Domain.Payout.Provider;

namespace Yoma.Core.Test.Core
{
  public class PayoutCancellationTests
  {
    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task LatestInfoUsesStatusWithoutRefreshingOrSettling(bool canCancel)
    {
      using var f = new Fixture();
      var response = f.Response();
      response.Status = PayoutTransactionStatus.Processing;
      response.CanCancel = canCancel;
      f.Provider.Setup(p => p.GetStatus(It.IsAny<PayoutStatusRequest>())).ReturnsAsync(response);
      var info = await f.Service.GetLatestInfoByUserId(f.Payout.UserId);
      Assert.Equal(f.Payout.Id, info.Id);
      Assert.Equal(canCancel, info.CanCancel);
      Assert.Equal(PayoutTransactionStatus.Processing, f.Payout.Status);
      Assert.Equal(RewardTransactionStatus.Reserved, f.Reward.Status);
      f.Provider.Verify(p => p.GetStatus(It.Is<PayoutStatusRequest>(
        r => r.Id == f.Payout.Id && r.TransactionId == f.Payout.TransactionId)), Times.Once);
      f.Provider.VerifyNoOtherCalls();
      f.RewardProvider.VerifyNoOtherCalls();
      Assert.Empty(f.Notifications.Invocations);
    }

    [Theory]
    [InlineData(PayoutTransactionStatus.Completed)]
    [InlineData(PayoutTransactionStatus.Cancelled)]
    [InlineData(PayoutTransactionStatus.Expired)]
    [InlineData(PayoutTransactionStatus.Failed)]
    public async Task TerminalLatestInfoDoesNotCallProvider(PayoutTransactionStatus status)
    {
      using var f = new Fixture();
      f.Payout.Status = status;
      var info = await f.Service.GetLatestInfoByUserId(f.Payout.UserId);
      Assert.False(info.CanCancel);
      f.Provider.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(HttpStatusCode.NotFound)]
    [InlineData(HttpStatusCode.Unauthorized)]
    [InlineData(HttpStatusCode.InternalServerError)]
    public async Task LatestInfoSurvivesProviderFailureWithUnknownEligibility(HttpStatusCode status)
    {
      using var f = new Fixture();
      f.Provider.Setup(p => p.GetStatus(It.IsAny<PayoutStatusRequest>()))
        .ThrowsAsync(new HttpClientException(status, "Provider unavailable"));
      var info = await f.Service.GetLatestInfoByUserId(f.Payout.UserId);
      Assert.Null(info.CanCancel);
      Assert.Equal(f.Payout.Id, info.Id);
      Assert.Equal(PayoutTransactionStatus.Processing, info.Status);
      f.RewardProvider.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task LatestInfoWithoutProviderReferenceRemainsUnknown()
    {
      using var f = new Fixture();
      f.Payout.TransactionId = null;
      var info = await f.Service.GetLatestInfoByUserId(f.Payout.UserId);
      Assert.Null(info.CanCancel);
      f.Provider.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task LatestInfoRejectsMismatchedEligibility()
    {
      using var f = new Fixture();
      var response = f.Response();
      response.Id = Guid.NewGuid();
      response.CanCancel = true;
      f.Provider.Setup(p => p.GetStatus(It.IsAny<PayoutStatusRequest>())).ReturnsAsync(response);
      var info = await f.Service.GetLatestInfoByUserId(f.Payout.UserId);
      Assert.Null(info.CanCancel);
      f.RewardProvider.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void StartAndResumeSessionsRetainPayoutIdAndEligibility(bool canCancel)
    {
      var payout = new PayoutTransaction { Id = Guid.NewGuid(), Amount = 10 };
      var expiry = DateTimeOffset.UtcNow.AddMinutes(20);
      var started = new PayoutResponse
        { CanCancel = canCancel, PaymentUrl = "https://ixo.test/pay", ExpiresAt = expiry }.ToPayoutSession(payout);
      var resumed = new PayoutSessionResponse
        { CanCancel = canCancel, PaymentUrl = "https://ixo.test/pay", ExpiresAt = expiry }.ToPayoutSession(payout);
      Assert.Equal(payout.Id, started.PayoutId);
      Assert.Equal(payout.Id, resumed.PayoutId);
      Assert.Equal(canCancel, started.CanCancel);
      Assert.Equal(canCancel, resumed.CanCancel);
    }

    [Theory]
    [InlineData(PayoutTransactionStatus.Processing)]
    [InlineData(PayoutTransactionStatus.Completed)]
    public void LatestPayoutInfoIncludesLocalId(PayoutTransactionStatus status)
    {
      var payout = new PayoutTransaction
      {
        Id = Guid.NewGuid(), UserId = Guid.NewGuid(), StatusId = Guid.NewGuid(),
        Status = status, Amount = 10, Currency = "USD", TransactionId = "pay_test"
      };
      var repository = new Mock<IRepositoryValueContains<PayoutTransaction>>();
      repository.Setup(p => p.Query()).Returns(new[] { payout }.AsQueryable());
      var statuses = new Mock<IPayoutTransactionStatusService>();
      statuses.Setup(p => p.GetByName(It.IsAny<string>())).Returns((string name) =>
        new Domain.Payout.Models.Lookups.PayoutTransactionStatus
          { Id = name == status.ToString() ? payout.StatusId : Guid.NewGuid(), Name = name });
      var service = new PayoutTransactionService(statuses.Object, repository.Object,
        Mock.Of<IUserService>(), Mock.Of<IRewardService>(), Mock.Of<IExecutionStrategyService>(),
        new PayoutTransactionSearchFilterValidator());
      var result = service.GetLatestInfoByUserId(payout.UserId);
      Assert.Equal(payout.Id, result.Id);
      Assert.Equal(status, result.Status);
      Assert.Equal(status == PayoutTransactionStatus.Processing, result.CanResume);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task CancellationAndWebhookEitherOrderReleaseOnce(bool webhookFirst)
    {
      using var f = new Fixture();
      if (webhookFirst) await f.Service.ProcessStatus(f.Response());
      await f.Service.Cancel(f.Payout.UserId, f.Payout.Id);
      await f.Service.ProcessStatus(f.Response());
      await f.Service.Cancel(f.Payout.UserId, f.Payout.Id);
      Assert.Equal(PayoutTransactionStatus.Cancelled, f.Payout.Status);
      Assert.Equal(RewardTransactionStatus.Released, f.Reward.Status);
      f.RewardProvider.Verify(p => p.ReleasePayoutReservation(It.IsAny<ReleasePayoutReservationRequest>()), Times.Once);
      f.Provider.Verify(p => p.Cancel(It.IsAny<PayoutCancellationRequest>()), webhookFirst ? Times.Never : Times.Once);
      Assert.Single(f.Notifications.Invocations);
    }

    [Fact]
    public async Task WebhookDuringCancelWaitsForSameLock()
    {
      using var f = new Fixture();
      var entered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
      var finish = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
      f.Provider.Setup(p => p.Cancel(It.IsAny<PayoutCancellationRequest>())).Returns(async () =>
      {
        entered.SetResult();
        await finish.Task;
        return f.Response();
      });
      var cancel = f.Service.Cancel(f.Payout.UserId, f.Payout.Id);
      await entered.Task.WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);
      var webhook = f.Service.ProcessStatus(f.Response());
      Assert.False(webhook.IsCompleted);
      finish.SetResult();
      await Task.WhenAll(cancel, webhook).WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);
      Assert.All(f.LockKeys, key => Assert.Equal($"payout:{f.Payout.Id}", key));
      f.RewardProvider.Verify(p => p.ReleasePayoutReservation(It.IsAny<ReleasePayoutReservationRequest>()), Times.Once);
    }

    [Fact]
    public async Task FailedReleaseLeavesPayoutRecoverableByWebhook()
    {
      using var f = new Fixture();
      f.RewardProvider.SetupSequence(p => p.ReleasePayoutReservation(It.IsAny<ReleasePayoutReservationRequest>()))
        .ThrowsAsync(new InvalidOperationException("Temporary release failure"))
        .Returns(Task.CompletedTask);
      await Assert.ThrowsAsync<InvalidOperationException>(() => f.Service.Cancel(f.Payout.UserId, f.Payout.Id));
      Assert.Equal(PayoutTransactionStatus.Processing, f.Payout.Status);
      Assert.Equal(RewardTransactionStatus.Reserved, f.Reward.Status);
      Assert.Empty(f.Notifications.Invocations);
      await f.Service.ProcessStatus(f.Response());
      Assert.Equal(PayoutTransactionStatus.Cancelled, f.Payout.Status);
      Assert.Equal(RewardTransactionStatus.Released, f.Reward.Status);
      Assert.Single(f.Notifications.Invocations);
    }

    [Theory]
    [InlineData(HttpStatusCode.Conflict)]
    [InlineData(HttpStatusCode.NotFound)]
    [InlineData(HttpStatusCode.InternalServerError)]
    public async Task RefusalOrUncertaintyKeepsReservation(HttpStatusCode status)
    {
      using var f = new Fixture();
      f.Provider.Setup(p => p.Cancel(It.IsAny<PayoutCancellationRequest>()))
        .ThrowsAsync(new HttpClientException(status, "Provider refusal or uncertain outcome"));
      await Assert.ThrowsAsync<HttpClientException>(() => f.Service.Cancel(f.Payout.UserId, f.Payout.Id));
      Assert.Equal(PayoutTransactionStatus.Processing, f.Payout.Status);
      Assert.Equal(RewardTransactionStatus.Reserved, f.Reward.Status);
      f.RewardProvider.VerifyNoOtherCalls();
      Assert.Empty(f.Notifications.Invocations);
    }

    [Fact]
    public async Task OwnershipCheckedEvenOnCancelledReplay()
    {
      using var f = new Fixture();
      f.Payout.Status = PayoutTransactionStatus.Cancelled;
      await Assert.ThrowsAsync<EntityNotFoundException>(() => f.Service.Cancel(Guid.NewGuid(), f.Payout.Id));
      await Assert.ThrowsAsync<EntityNotFoundException>(() => f.Service.Cancel(f.Payout.UserId, Guid.NewGuid()));
      f.Provider.VerifyNoOtherCalls();
      f.RewardProvider.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(PayoutTransactionStatus.Completed)]
    [InlineData(PayoutTransactionStatus.Failed)]
    [InlineData(PayoutTransactionStatus.Expired)]
    public async Task TerminalPayoutCannotBeCancelled(PayoutTransactionStatus status)
    {
      using var f = new Fixture();
      f.Payout.Status = status;
      await Assert.ThrowsAsync<ValidationException>(() => f.Service.Cancel(f.Payout.UserId, f.Payout.Id));
      f.Provider.VerifyNoOtherCalls();
      f.RewardProvider.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task MissingProviderReferenceIsNotLocalCancellation()
    {
      using var f = new Fixture();
      f.Payout.TransactionId = null;
      await Assert.ThrowsAsync<ValidationException>(() => f.Service.Cancel(f.Payout.UserId, f.Payout.Id));
      f.Provider.VerifyNoOtherCalls();
      f.RewardProvider.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task UnexpectedConfirmationDoesNotRelease(bool wrongId)
    {
      using var f = new Fixture();
      var response = f.Response();
      if (wrongId) response.Id = Guid.NewGuid();
      else response.Status = PayoutTransactionStatus.Processing;
      f.Provider.Setup(p => p.Cancel(It.IsAny<PayoutCancellationRequest>())).ReturnsAsync(response);
      await Assert.ThrowsAsync<DataInconsistencyException>(() => f.Service.Cancel(f.Payout.UserId, f.Payout.Id));
      f.RewardProvider.VerifyNoOtherCalls();
    }

    private sealed class Fixture : IDisposable
    {
      private readonly SemaphoreSlim _mutex = new(1);
      public List<string> LockKeys { get; } = [];
      public PayoutTransaction Payout { get; } = new()
      {
        Id = Guid.NewGuid(), UserId = Guid.NewGuid(), TransactionId = "pay_test",
        Status = PayoutTransactionStatus.Processing, Provider = "YellowCard", Type = "PayoutRewards", Currency = "USD", Amount = 10
      };
      public RewardTransaction Reward { get; } = new() { Status = RewardTransactionStatus.Reserved, TransactionId = "res_test", Amount = 450 };
      public Mock<IPayoutProviderClient> Provider { get; } = new();
      public Mock<IRewardProviderClient> RewardProvider { get; } = new();
      public Mock<INotificationDeliveryService> Notifications { get; } = new();
      public PayoutService Service { get; }
      public PayoutStatusResponse Response() => new()
        { Id = Payout.Id, TransactionId = "pay_test", Provider = Domain.Payout.Provider.YellowCard, Status = PayoutTransactionStatus.Cancelled };

      public Fixture()
      {
        var providerFactory = new Mock<IPayoutProviderClientFactory>();
        providerFactory.Setup(p => p.CreateClient()).Returns(Provider.Object);
        Provider.Setup(p => p.Cancel(It.IsAny<PayoutCancellationRequest>())).ReturnsAsync(() => Response());
        var rewardFactory = new Mock<IRewardProviderClientFactory>();
        rewardFactory.Setup(p => p.CreateClient()).Returns(RewardProvider.Object);
        var repo = new Mock<IRepositoryValueContains<PayoutTransaction>>();
        repo.Setup(p => p.Query()).Returns(() => new[] { Payout }.AsQueryable());
        repo.Setup(p => p.Query(It.IsAny<LockMode>())).Returns(() => new[] { Payout }.AsQueryable());
        repo.Setup(p => p.Update(It.IsAny<PayoutTransaction>())).ReturnsAsync((PayoutTransaction p) => p);
        var rewards = new Mock<IRewardService>();
        rewards.Setup(p => p.GetByEntity(Payout.UserId, RewardTransactionEntityType.Payout, Payout.Id, It.IsAny<LockMode?>())).Returns(Reward);
        var statuses = new Mock<IPayoutTransactionStatusService>();
        statuses.Setup(p => p.GetByName(It.IsAny<string>())).Returns((string name) =>
          new Domain.Payout.Models.Lookups.PayoutTransactionStatus { Id = Guid.NewGuid(), Name = name });
        var users = new Mock<IUserService>();
        users.Setup(p => p.GetById(Payout.UserId, false, false)).Returns(new User { Id = Payout.UserId, Email = "test@example.org" });
        var strategy = new Mock<IExecutionStrategyService>();
        strategy.Setup(p => p.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>(), false)).Returns((Func<Task> action, bool _) => action());
        var locks = new Mock<IDistributedLockService>();
        var transactions = new Mock<IPayoutTransactionService>();
        transactions.Setup(p => p.GetLatestInfoByUserId(Payout.UserId)).Returns(() => new PayoutTransactionInfo
        {
          Id = Payout.Id, Status = Payout.Status, Amount = Payout.Amount, Currency = Currency.USD,
          DateCreated = Payout.DateCreated
        });
        locks.Setup(p => p.RunWithLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<Func<Task>>(), It.IsAny<string>()))
          .Returns(async (string key, TimeSpan duration, Func<Task> action, string process) =>
          {
            Assert.StartsWith("payout:", key);
            LockKeys.Add(key);
            await _mutex.WaitAsync();
            try { await action(); } finally { _mutex.Release(); }
          });
        Service = new PayoutService(Mock.Of<ILogger<PayoutService>>(), Options.Create(new AppSettings
          { DistributedLockPayoutDurationInSeconds = 30, PayoutRewardReservationExpirationInMinutes = 1800 }),
          Mock.Of<IEnvironmentProvider>(), locks.Object, users.Object, Mock.Of<ICountryService>(),
          Mock.Of<IWalletService>(), rewards.Object, rewardFactory.Object, transactions.Object,
          repo.Object, statuses.Object, providerFactory.Object, Mock.Of<ITreasuryService>(), strategy.Object,
          Notifications.Object, Mock.Of<INotificationURLFactory>());
      }
      public void Dispose() => _mutex.Dispose();
    }
  }
}
