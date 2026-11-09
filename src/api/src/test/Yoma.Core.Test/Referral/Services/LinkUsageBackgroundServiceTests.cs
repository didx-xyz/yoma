using Hangfire;
using Hangfire.Common;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Referral;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.Referral.Services;
using Yoma.Core.Test.Referral.Builders;
using Yoma.Core.Test.Referral.Fixtures;

namespace Yoma.Core.Test.Referral.Services
{
  public class LinkUsageBackgroundServiceTests
  {
    [Fact]
    public void PendingProgress_InterfaceJobDisablesAutomaticExceptionRetries()
    {
      var job = Job.FromExpression<ILinkUsageBackgroundService>(s => s.ProcessPendingProgress(CancellationToken.None));
      var filter = Assert.Single(new JobFilterAttributeFilterProvider().GetFilters(job)
        .Select(o => o.Instance).OfType<AutomaticRetryAttribute>());

      Assert.Equal(0, filter.Attempts);
    }

    [Fact]
    public async Task PendingProgress_VisitsEachPendingUserOnce_EvenWhenClaimsRemainPending()
    {
      var fixture = new Fixture();
      var first = new ReferralLinkUsageBuilder().Build();
      var second = new ReferralLinkUsageBuilder().Build();
      fixture.Items.AddRange([first, second, new ReferralLinkUsageBuilder().WithUserId(first.UserId).Build(),
        new ReferralLinkUsageBuilder().WithStatus(ReferralLinkUsageStatus.Completed).Build(),
        new ReferralLinkUsageBuilder().WithStatus(ReferralLinkUsageStatus.Expired).Build()]);
      fixture.Items.Add(new ReferralLinkUsage
      {
        UserId = Guid.NewGuid(), Status = ReferralLinkUsageStatus.Abandoned, StatusId = LookupBuilder.UsageStatusAbandonedId
      });
      fixture.Items.Add(new ReferralLinkUsage
      {
        UserId = Guid.NewGuid(), Status = ReferralLinkUsageStatus.Initiated, StatusId = LookupBuilder.UsageStatusInitiatedId
      });

      await fixture.Build().ProcessPendingProgress(CancellationToken.None);

      Assert.Equal(2, fixture.UsersProcessed.Count);
      Assert.Contains(first.UserId, fixture.UsersProcessed);
      Assert.Contains(second.UserId, fixture.UsersProcessed);
      Assert.Equal(2, fixture.ScopesCreated);
      Assert.Equal(2, fixture.ScopesDisposed);
      fixture.VerifyReleased();
      fixture.Repository.Verify(r => r.Update(It.IsAny<ReferralLinkUsage>()), Times.Never);
    }

    [Fact]
    public async Task PendingProgress_SnapshotDoesNotSkipUsersAsClaimsComplete_OrIncludeNewUsersMidRun()
    {
      var fixture = new Fixture();
      fixture.Items.AddRange(Enumerable.Range(0, 5).Select(_ => new ReferralLinkUsageBuilder().Build()));
      var originalUsers = fixture.Items.Select(o => o.UserId).ToHashSet();
      fixture.Process = userId =>
      {
        fixture.Items.Single(o => o.UserId == userId).StatusId = LookupBuilder.UsageStatusCompletedId;
        fixture.Items.Add(new ReferralLinkUsageBuilder().Build());
        return Task.CompletedTask;
      };

      await fixture.Build().ProcessPendingProgress(CancellationToken.None);

      Assert.Equal(5, fixture.UsersProcessed.Count);
      Assert.True(originalUsers.SetEquals(fixture.UsersProcessed));
      Assert.Equal(5, fixture.ScopesDisposed);
    }

    [Fact]
    public async Task PendingProgress_OneFailureDoesNotStopOtherUsers_AndRunFailsVisibly()
    {
      var fixture = new Fixture();
      var failed = new ReferralLinkUsageBuilder().Build();
      fixture.Items.AddRange([failed, new ReferralLinkUsageBuilder().Build()]);
      fixture.Process = userId => userId == failed.UserId
        ? Task.FromException(new InvalidOperationException("Synthetic processing failure")) : Task.CompletedTask;

      var error = await Assert.ThrowsAsync<InvalidOperationException>(() => fixture.Build().ProcessPendingProgress(CancellationToken.None));

      Assert.Contains("1 failed users", error.Message);
      Assert.Equal(2, fixture.UsersProcessed.Count);
      Assert.Equal(2, fixture.ScopesDisposed);
      fixture.VerifyReleased();
    }

    [Fact]
    public async Task PendingProgress_ManualRetryUsesFreshPendingState()
    {
      var fixture = new Fixture();
      fixture.Items.AddRange([new ReferralLinkUsageBuilder().Build(), new ReferralLinkUsageBuilder().Build()]);
      fixture.Process = userId =>
      {
        fixture.Items.Single(o => o.UserId == userId).StatusId = LookupBuilder.UsageStatusCompletedId;
        return Task.CompletedTask;
      };
      var service = fixture.Build();

      await service.ProcessPendingProgress(CancellationToken.None);
      await service.ProcessPendingProgress(CancellationToken.None);

      Assert.Equal(2, fixture.UsersProcessed.Count);
      Assert.Equal(2, fixture.ScopesCreated);
    }

    [Fact]
    public async Task PendingProgress_BusyLockDoesNotProcessOrReleaseAnotherOwner()
    {
      var fixture = new Fixture();
      fixture.Lock.Setup(s => s.TryRunWithLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), TimeSpan.Zero,
        It.IsAny<Func<Task>>(), It.IsAny<CancellationToken>(), It.IsAny<string>())).ReturnsAsync(false);

      await fixture.Build().ProcessPendingProgress(CancellationToken.None);

      Assert.Empty(fixture.UsersProcessed);
      fixture.Repository.Verify(r => r.Query(), Times.Never);
      fixture.Lock.Verify(s => s.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task PendingProgress_CancellationStopsDispatchAndReleasesLock()
    {
      using var cancellation = new CancellationTokenSource();
      var fixture = new Fixture();
      fixture.Items.AddRange([new ReferralLinkUsageBuilder().Build(), new ReferralLinkUsageBuilder().Build()]);
      fixture.Process = _ => { cancellation.Cancel(); return Task.CompletedTask; };

      await Assert.ThrowsAnyAsync<OperationCanceledException>(() => fixture.Build().ProcessPendingProgress(cancellation.Token));

      Assert.Single(fixture.UsersProcessed);
      Assert.Equal(1, fixture.ScopesDisposed);
      fixture.VerifyReleased();
    }

    [Fact]
    public async Task PendingProgress_QueryFailureReleasesLockAndIsNotSwallowed()
    {
      var fixture = new Fixture();
      fixture.Repository.Setup(r => r.Query()).Throws(new InvalidOperationException("Synthetic query failure"));

      await Assert.ThrowsAsync<InvalidOperationException>(() => fixture.Build().ProcessPendingProgress(CancellationToken.None));

      Assert.Empty(fixture.UsersProcessed);
      fixture.VerifyReleased();
    }

    [Fact]
    public async Task PendingProgress_EmptySnapshotCompletesWithoutCreatingScopes()
    {
      var fixture = new Fixture();

      await fixture.Build().ProcessPendingProgress(CancellationToken.None);

      Assert.Equal(0, fixture.ScopesCreated);
      fixture.VerifyReleased();
    }

    private sealed class Fixture
    {
      public List<ReferralLinkUsage> Items { get; } = [];
      public List<Guid> UsersProcessed { get; } = [];
      public Mock<IRepositoryBatched<ReferralLinkUsage>> Repository { get; } = new();
      public Mock<IDistributedLockService> Lock { get; } = new();
      public Func<Guid, Task> Process { get; set; } = _ => Task.CompletedTask;
      public int ScopesCreated { get; private set; }
      public int ScopesDisposed { get; private set; }
      private int _lockExits;
      private readonly Mock<IServiceScopeFactory> _scopeFactory = new();

      public Fixture()
      {
        Repository.Setup(r => r.Query()).Returns(() => Items.AsQueryable());
        Lock.Setup(s => s.TryRunWithLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), TimeSpan.Zero,
          It.IsAny<Func<Task>>(), It.IsAny<CancellationToken>(), It.IsAny<string>()))
          .Returns<string, TimeSpan, TimeSpan, Func<Task>, CancellationToken, string>(async (_, _, _, action, token, _) =>
          {
            try
            {
              token.ThrowIfCancellationRequested();
              await action();
              return true;
            }
            finally { _lockExits++; }
          });
        _scopeFactory.Setup(s => s.CreateScope()).Returns(() =>
        {
          // Verify sequential use and disposal before the next user's service is resolved.
          Assert.Equal(ScopesCreated, ScopesDisposed);
          ScopesCreated++;
          var service = new Mock<ILinkUsageService>();
          service.Setup(s => s.ProcessProgressByUserId(It.IsAny<Guid>())).Returns<Guid>(async userId =>
          {
            UsersProcessed.Add(userId);
            await Process(userId);
          });
          var provider = new Mock<IServiceProvider>();
          provider.Setup(p => p.GetService(typeof(ILinkUsageService))).Returns(service.Object);
          var scope = new Mock<IServiceScope>();
          scope.SetupGet(s => s.ServiceProvider).Returns(provider.Object);
          scope.Setup(s => s.Dispose()).Callback(() => ScopesDisposed++);
          return scope.Object;
        });
      }

      public LinkUsageBackgroundService Build() => new(
        Mock.Of<ILogger<LinkUsageBackgroundService>>(),
        Options.Create(new ScheduleJobOptions { DefaultScheduleMaxIntervalInHours = 1, DistributedLockDurationBufferInMinutes = 5 }),
        _scopeFactory.Object, Lock.Object, MockLookupServices.CreateLinkUsageStatusService().Object, Repository.Object);

      public void VerifyReleased()
      {
        Assert.Equal(1, _lockExits);
        Lock.Verify(s => s.TryRunWithLockAsync("referral_link_usage_process_pending_progress", It.Is<TimeSpan>(t => t > TimeSpan.FromHours(1)),
          TimeSpan.Zero, It.IsAny<Func<Task>>(), It.IsAny<CancellationToken>(), nameof(LinkUsageBackgroundService.ProcessPendingProgress)), Times.Once);
      }
    }
  }
}
