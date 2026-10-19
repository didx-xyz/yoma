using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using System.Reflection;
using Xunit;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Test.Core
{
  public class BackgroundJobExecutionScopeTests
  {
    #region Tests
    [Fact]
    public void ConstructionIsRestrictedToTheScopeFactories()
    {
      var constructors = typeof(BackgroundJobExecutionScope).GetConstructors(
        BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);

      Assert.True(Assert.Single(constructors).IsPrivate);
    }

    [Fact]
    public async Task OriginalCallingJobNameIsPreservedForAcquisitionAndRelease()
    {
      using var fixture = new Fixture();

      await RunJob(fixture);

      fixture.Locks.Verify(service => service.TryAcquireLockAsync("job-key", TimeSpan.FromMinutes(1), nameof(RunJob)), Times.Once);
      fixture.Locks.Verify(service => service.ReleaseLockAsync("job-key", nameof(RunJob)), Times.Once);
    }

    [Fact]
    public async Task AlreadyStoppingDoesNotAcquireOrReleaseALock()
    {
      using var fixture = new Fixture();
      fixture.Stopping.Cancel();

      await Assert.ThrowsAnyAsync<OperationCanceledException>(() => RunJob(fixture));

      fixture.Locks.Verify(service => service.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<string>()), Times.Never);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task StopDuringAcquisitionReleasesTheAcquiredLock()
    {
      using var fixture = new Fixture();
      fixture.Locks.Setup(service => service.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<string>()))
        .Callback(() => fixture.Stopping.Cancel()).ReturnsAsync(true);

      await Assert.ThrowsAnyAsync<OperationCanceledException>(() => RunJob(fixture));

      fixture.Locks.Verify(service => service.ReleaseLockAsync("job-key", nameof(RunJob)), Times.Once);
    }

    [Fact]
    public async Task UnacquiredLockIsNeverReleased()
    {
      using var fixture = new Fixture();
      fixture.Locks.Setup(service => service.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<string>())).ReturnsAsync(false);

      await RunJob(fixture);

      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task AcquisitionFailureIsNotSwallowedAndDoesNotReleaseAnUnknownLock()
    {
      using var fixture = new Fixture();
      fixture.Locks.Setup(service => service.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<string>()))
        .ThrowsAsync(new InvalidOperationException("Redis unavailable"));

      var error = await Assert.ThrowsAsync<InvalidOperationException>(() => RunJob(fixture));

      Assert.Equal("Redis unavailable", error.Message);
      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task RepeatedDisposalReleasesTheLockOnlyOnce()
    {
      using var fixture = new Fixture();
      var scope = fixture.CreateScope();
      Assert.True(await scope.TryAcquireLockAsync("job-key", TimeSpan.FromMinutes(1)));

      await scope.DisposeAsync();
      await scope.DisposeAsync();

      fixture.Locks.Verify(service => service.ReleaseLockAsync("job-key", "TestJob"), Times.Once);
    }

    [Fact]
    public async Task DisposedScopeCannotAcquireOrCheckForMoreWork()
    {
      using var fixture = new Fixture();
      var scope = fixture.CreateScope();
      await scope.DisposeAsync();

      await Assert.ThrowsAsync<ObjectDisposedException>(() => scope.TryAcquireLockAsync("job-key", TimeSpan.FromMinutes(1)));
      Assert.Throws<ObjectDisposedException>(() => scope.ThrowIfStopping());
      Assert.Throws<ObjectDisposedException>(() => scope.ThrowIfStopping(new InvalidOperationException("Job failed")));
      fixture.Locks.Verify(service => service.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<string>()), Times.Never);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task ScopeCannotAcquireASecondLock(bool acquired)
    {
      using var fixture = new Fixture();
      fixture.Locks.Setup(service => service.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<string>())).ReturnsAsync(acquired);
      await using var scope = fixture.CreateScope();
      Assert.Equal(acquired, await scope.TryAcquireLockAsync("job-key", TimeSpan.FromMinutes(1)));

      await Assert.ThrowsAsync<InvalidOperationException>(() => scope.TryAcquireLockAsync("second-key", TimeSpan.FromMinutes(1)));

      fixture.Locks.Verify(service => service.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task ReleaseFailureIsSurfacedWithoutASecondReleaseAttempt()
    {
      using var fixture = new Fixture();
      var scope = fixture.CreateScope();
      Assert.True(await scope.TryAcquireLockAsync("job-key", TimeSpan.FromMinutes(1)));
      fixture.Locks.Setup(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()))
        .ThrowsAsync(new InvalidOperationException("Release failed"));

      await Assert.ThrowsAsync<InvalidOperationException>(() => scope.DisposeAsync().AsTask());
      await scope.DisposeAsync();

      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task ScopeReleasesAfterTheJobFinalizerEvenWhenThatFinalizerFails()
    {
      using var fixture = new Fixture();
      var finalizerReached = false;
      fixture.Locks.Setup(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()))
        .Callback(() => Assert.True(finalizerReached)).Returns(Task.CompletedTask);

      async Task Execute()
      {
        await using var scope = fixture.CreateScope();
        Assert.True(await scope.TryAcquireLockAsync("job-key", TimeSpan.FromMinutes(1)));
        try { throw new InvalidOperationException("Job interrupted"); }
        finally
        {
          finalizerReached = true;
          throw new ObjectDisposedException("Tracking store");
        }
      }

      await Assert.ThrowsAsync<ObjectDisposedException>(Execute);

      fixture.Locks.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task ShutdownExceptionPreservesCauseTokenAndProcessInTheWarning()
    {
      using var fixture = new Fixture();
      await using var scope = fixture.CreateScope();
      fixture.Stopping.Cancel();
      var cause = new ObjectDisposedException("Dependency");

      var result = Assert.Throws<OperationCanceledException>(() => scope.ThrowIfStopping(cause));

      Assert.True(scope.IsStopping);
      Assert.Same(cause, result.InnerException);
      Assert.Equal(fixture.Stopping.Token, result.CancellationToken);
      fixture.Logger.Verify(logger => logger.Log(LogLevel.Warning, It.IsAny<EventId>(),
        It.Is<It.IsAnyType>((state, _) => state != null && state.ToString()!.Contains("TestJob", StringComparison.Ordinal)),
        It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
    }

    [Fact]
    public async Task LoggerIsOptionalForALockedScope()
    {
      using var fixture = new Fixture();
      await using (var scope = BackgroundJobExecutionScope.CreateWithLock(fixture.Lifetime.Object,
        fixture.Locks.Object, processName: "WithoutLogger"))
      {
        Assert.True(await scope.TryAcquireLockAsync("job-key", TimeSpan.FromMinutes(1)));
        fixture.Stopping.Cancel();
        var cause = new InvalidOperationException("Dependency stopped");

        var result = Assert.Throws<OperationCanceledException>(() => scope.ThrowIfStopping(cause));

        Assert.Same(cause, result.InnerException);
        Assert.Equal(fixture.Stopping.Token, result.CancellationToken);
      }

      fixture.Locks.Verify(service => service.ReleaseLockAsync("job-key", "WithoutLogger"), Times.Once);
    }

    [Fact]
    public async Task LifecycleOnlyScopeDoesNotRequireALoggerOrLockService()
    {
      using var fixture = new Fixture();
      await using (var scope = BackgroundJobExecutionScope.Create(fixture.Lifetime.Object))
      {
        Assert.False(scope.IsStopping);
        scope.ThrowIfStopping();
        fixture.Stopping.Cancel();

        var result = Assert.Throws<OperationCanceledException>(() => scope.ThrowIfStopping());

        Assert.Equal(fixture.Stopping.Token, result.CancellationToken);
      }

      fixture.Locks.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task LifecycleOnlyScopeRejectsAccidentalLockAcquisition()
    {
      using var fixture = new Fixture();
      await using var scope = BackgroundJobExecutionScope.Create(fixture.Lifetime.Object);

      var result = await Assert.ThrowsAsync<InvalidOperationException>(
        () => scope.TryAcquireLockAsync("job-key", TimeSpan.FromMinutes(1)));

      Assert.Contains("without a distributed lock service", result.Message);
      fixture.Locks.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task OrdinaryExceptionReturnsToExistingErrorHandlingWithoutLoggingShutdown()
    {
      using var fixture = new Fixture();
      await using var scope = fixture.CreateScope();
      var cause = new InvalidOperationException("Provider unavailable");

      scope.ThrowIfStopping(cause);

      Assert.False(scope.IsStopping);
      fixture.Logger.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task FinishingTheLastUnitDuringShutdownDoesNotTurnDisposalIntoAFailure()
    {
      using var fixture = new Fixture();
      var scope = fixture.CreateScope();
      Assert.True(await scope.TryAcquireLockAsync("job-key", TimeSpan.FromMinutes(1)));
      fixture.Stopping.Cancel();

      await scope.DisposeAsync();

      fixture.Locks.Verify(service => service.ReleaseLockAsync("job-key", "TestJob"), Times.Once);
      fixture.Logger.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task LifecycleOnlyFactoryPreservesTheOriginalCallerInShutdownLogging()
    {
      using var fixture = new Fixture();
      fixture.Stopping.Cancel();

      await Assert.ThrowsAnyAsync<OperationCanceledException>(() => RunWithoutLock(fixture));

      fixture.Logger.Verify(logger => logger.Log(LogLevel.Warning, It.IsAny<EventId>(),
        It.Is<It.IsAnyType>((state, _) => state != null && state.ToString()!.Contains(nameof(RunWithoutLock), StringComparison.Ordinal)),
        It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
      fixture.Locks.VerifyNoOtherCalls();
    }

    [Fact]
    public void LockedFactoryStillRequiresALockService()
    {
      using var fixture = new Fixture();

      var result = Assert.Throws<ArgumentNullException>(() =>
        BackgroundJobExecutionScope.CreateWithLock(fixture.Lifetime.Object, null!));

      Assert.Equal("distributedLockService", result.ParamName);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void BothFactoriesRequireAnApplicationLifetime(bool withLock)
    {
      using var fixture = new Fixture();

      var result = Assert.Throws<ArgumentNullException>(() => withLock
        ? BackgroundJobExecutionScope.CreateWithLock(null!, fixture.Locks.Object)
        : BackgroundJobExecutionScope.Create(null!));

      Assert.Equal("applicationLifetime", result.ParamName);
    }
    #endregion Tests

    #region Helpers
    private static async Task RunJob(Fixture fixture)
    {
      await using var scope = BackgroundJobExecutionScope.CreateWithLock(fixture.Lifetime.Object, fixture.Locks.Object, fixture.Logger.Object);
      if (!await scope.TryAcquireLockAsync("job-key", TimeSpan.FromMinutes(1))) return;
      scope.ThrowIfStopping();
    }

    private static async Task RunWithoutLock(Fixture fixture)
    {
      await using var scope = BackgroundJobExecutionScope.Create(fixture.Lifetime.Object, fixture.Logger.Object);
      try
      {
        scope.ThrowIfStopping();
      }
      catch (Exception ex)
      {
        scope.ThrowIfStopping(ex);
        throw;
      }
    }

    private sealed class Fixture : IDisposable
    {
      public CancellationTokenSource Stopping { get; } = new();
      public Mock<ILogger> Logger { get; } = new();
      public Mock<IHostApplicationLifetime> Lifetime { get; } = new();
      public Mock<IDistributedLockService> Locks { get; } = new();

      public Fixture()
      {
        Logger.Setup(logger => logger.IsEnabled(LogLevel.Warning)).Returns(true);
        Lifetime.SetupGet(value => value.ApplicationStopping).Returns(Stopping.Token);
        Locks.Setup(service => service.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<string>())).ReturnsAsync(true);
      }

      public BackgroundJobExecutionScope CreateScope() => BackgroundJobExecutionScope.CreateWithLock(
        Lifetime.Object, Locks.Object, Logger.Object, "TestJob");

      public void Dispose() => Stopping.Dispose();
    }
    #endregion Helpers
  }
}
