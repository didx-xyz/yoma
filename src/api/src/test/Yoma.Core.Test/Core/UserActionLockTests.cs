using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using StackExchange.Redis;
using System.Reflection;
using Xunit;
using Yoma.Core.Api.Controllers;
using Yoma.Core.Api.Middleware;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Test.Referral.Builders;
using Yoma.Core.Test.Referral.Fixtures;

namespace Yoma.Core.Test.Core
{
  public class UserActionLockTests
  {
    #region Filter Tests
    [Fact]
    public void OnlyTheTwelveReviewedMutationsAreOptedIn()
    {
      var actions = typeof(MyOpportunityController).Assembly.GetTypes()
        .Where(type => typeof(ControllerBase).IsAssignableFrom(type))
        .SelectMany(type => type.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly))
        .Where(method => method.GetCustomAttribute<UserActionLockAttribute>() != null)
        .Select(method => $"{method.DeclaringType!.Name}.{method.Name}")
        .Order()
        .ToArray();

      Assert.Equal(new[]
      {
        $"{nameof(MyOpportunityController)}.{nameof(MyOpportunityController.PerformActionInstantVerification)}",
        $"{nameof(MyOpportunityController)}.{nameof(MyOpportunityController.PerformActionNavigatedExternalLink)}",
        $"{nameof(MyOpportunityController)}.{nameof(MyOpportunityController.PerformActionSaved)}",
        $"{nameof(MyOpportunityController)}.{nameof(MyOpportunityController.PerformActionSavedRemove)}",
        $"{nameof(MyOpportunityController)}.{nameof(MyOpportunityController.PerformActionSendForVerificationManual)}",
        $"{nameof(MyOpportunityController)}.{nameof(MyOpportunityController.PerformActionSendForVerificationManualDelete)}",
        $"{nameof(MyOpportunityController)}.{nameof(MyOpportunityController.PerformActionViewed)}",
        $"{nameof(OrganizationController)}.{nameof(OrganizationController.Create)}",
        $"{nameof(ReferralController)}.{nameof(ReferralController.ClaimAsReferee)}",
        $"{nameof(ReferralController)}.{nameof(ReferralController.ClaimAsRefereeInitiate)}",
        $"{nameof(UserController)}.{nameof(UserController.UpdateProfile)}",
        $"{nameof(UserController)}.{nameof(UserController.YoIDOnboard)}"
      }, actions);
    }

    [Fact]
    public void AttributeActivatesThroughMvcDependencyInjection()
    {
      var redis = new RedisFixture();
      var request = new Request(redis, Guid.NewGuid());
      using var provider = new ServiceCollection()
        .AddSingleton<IOptions<AppSettings>>(Options.Create(request.Settings))
        .AddSingleton(request.Accessor.Object)
        .AddSingleton(request.Users.Object)
        .AddSingleton<IDistributedLockService>(redis.CreateService())
        .BuildServiceProvider();

      var attribute = new UserActionLockAttribute();

      Assert.IsType<UserActionLockFilter>(attribute.CreateInstance(provider));
      Assert.False(attribute.IsReusable);
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData("", null)]
    [InlineData("   ", null)]
    [InlineData(" \t\r\n", null)]
    [InlineData("shared", "shared")]
    [InlineData(" shared ", "shared")]
    public void AttributeNormalizesOptionalScope(string? scope, string? expected)
    {
      Assert.Equal(expected, new UserActionLockAttribute(scope).Scope);
    }

    [Theory]
    [InlineData(typeof(ReferralController), nameof(ReferralController.ClaimAsReferee), nameof(ReferralController.ClaimAsRefereeInitiate))]
    [InlineData(typeof(MyOpportunityController), nameof(MyOpportunityController.PerformActionSaved), nameof(MyOpportunityController.PerformActionSavedRemove))]
    [InlineData(typeof(MyOpportunityController), nameof(MyOpportunityController.PerformActionSendForVerificationManual), nameof(MyOpportunityController.PerformActionInstantVerification))]
    [InlineData(typeof(MyOpportunityController), nameof(MyOpportunityController.PerformActionSendForVerificationManual), nameof(MyOpportunityController.PerformActionSendForVerificationManualDelete))]
    [InlineData(typeof(UserController), nameof(UserController.UpdateProfile), nameof(UserController.YoIDOnboard))]
    public async Task RelatedActionsUseTheSameExplicitControllerScope(Type controller, string scope, string relatedAction)
    {
      var redis = new RedisFixture();
      var user = Guid.NewGuid();
      var request = new Request(redis, user);
      var locks = new Mock<IDistributedLockService>(MockBehavior.Strict);
      var expected = $"api_user_action:{user}:{controller.FullName}:scope:{scope}";
      locks.Setup(service => service.TryRunWithLockAsync(expected, TimeSpan.FromSeconds(120), TimeSpan.FromMilliseconds(2000),
          It.IsAny<Func<Task>>(), It.IsAny<CancellationToken>(), It.IsAny<string>()))
        .Returns(async (string _, TimeSpan _, TimeSpan _, Func<Task> action, CancellationToken _, string _) =>
        {
          await action();
          return true;
        });
      var executed = 0;
      foreach (var name in new[] { scope, relatedAction })
        await request.Execute(() => { executed++; return Task.CompletedTask; }, locks.Object, controller.GetMethod(name));

      Assert.Equal(2, executed);
      locks.VerifyAll();
    }

    [Theory]
    [InlineData(typeof(MyOpportunityController), nameof(MyOpportunityController.PerformActionSaved), nameof(MyOpportunityController.PerformActionSavedRemove))]
    [InlineData(typeof(MyOpportunityController), nameof(MyOpportunityController.PerformActionSavedRemove), nameof(MyOpportunityController.PerformActionSaved))]
    [InlineData(typeof(MyOpportunityController), nameof(MyOpportunityController.PerformActionSendForVerificationManual), nameof(MyOpportunityController.PerformActionInstantVerification))]
    [InlineData(typeof(MyOpportunityController), nameof(MyOpportunityController.PerformActionInstantVerification), nameof(MyOpportunityController.PerformActionSendForVerificationManual))]
    [InlineData(typeof(MyOpportunityController), nameof(MyOpportunityController.PerformActionSendForVerificationManual), nameof(MyOpportunityController.PerformActionSendForVerificationManualDelete))]
    [InlineData(typeof(MyOpportunityController), nameof(MyOpportunityController.PerformActionSendForVerificationManualDelete), nameof(MyOpportunityController.PerformActionSendForVerificationManual))]
    [InlineData(typeof(UserController), nameof(UserController.UpdateProfile), nameof(UserController.YoIDOnboard))]
    [InlineData(typeof(UserController), nameof(UserController.YoIDOnboard), nameof(UserController.UpdateProfile))]
    public async Task RelatedActionsWaitForThePrecedingActionBeforeDispatch(Type controller, string firstAction, string secondAction)
    {
      var redis = new RedisFixture();
      var user = Guid.NewGuid();
      var first = new Request(redis, user);
      var second = new Request(redis, user);
      var entered = Signal();
      var finish = Signal();
      var dispatched = false;
      var running = first.Execute(async () => { entered.SetResult(); await finish.Task; }, method: controller.GetMethod(firstAction));
      await entered.Task.WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);
      var waiting = second.Execute(() => { dispatched = true; return Task.CompletedTask; }, method: controller.GetMethod(secondAction));

      try
      {
        await redis.Contended.Task.WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);
        Assert.False(dispatched);
        Assert.False(waiting.IsCompleted);
      }
      finally
      {
        finish.TrySetResult();
        await Task.WhenAll(running, waiting);
      }

      Assert.True(dispatched);
      Assert.Empty(redis.Owners);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(73)]
    [InlineData(300)]
    public async Task ConfiguredLeaseIsUsedWithoutAddingABuffer(int leaseDurationSeconds)
    {
      var redis = new RedisFixture();
      var request = new Request(redis, Guid.NewGuid());
      request.Settings.DistributedLockUserActionLeaseDurationInSeconds = leaseDurationSeconds;

      await request.Execute(() => Task.CompletedTask);

      redis.Database.Verify(database => database.LockTakeAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(),
        TimeSpan.FromSeconds(leaseDurationSeconds), CommandFlags.None), Times.Once);
      Assert.Empty(redis.Owners);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task InvalidLeaseConfigurationDoesNotAcquireALockOrExecuteTheAction(int leaseDurationSeconds)
    {
      var redis = new RedisFixture();
      var request = new Request(redis, Guid.NewGuid());
      request.Settings.DistributedLockUserActionLeaseDurationInSeconds = leaseDurationSeconds;
      var executed = false;

      var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => request.Execute(() =>
      {
        executed = true;
        return Task.CompletedTask;
      }));

      Assert.Equal("AppSettings:DistributedLockUserActionLeaseDurationInSeconds must be greater than zero.", exception.Message);
      Assert.False(executed);
      redis.Database.Verify(database => database.LockTakeAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(),
        It.IsAny<TimeSpan>(), It.IsAny<CommandFlags>()), Times.Never);
    }

    [Fact]
    public async Task SameUserAndActionAcrossApiInstancesRechecksStateAfterPrecedingActionFinishes()
    {
      var redis = new RedisFixture();
      var userId = Guid.NewGuid();
      var first = new Request(redis, userId);
      var second = new Request(redis, userId);
      var entered = Signal();
      var finish = Signal();
      var completed = false;
      var reads = 0;
      var writes = 0;

      async Task Action(bool pause)
      {
        reads++;
        if (completed) return;
        if (pause)
        {
          entered.SetResult();
          await finish.Task;
        }
        writes++;
        completed = true;
      }

      var running = first.Execute(() => Action(true));
      await entered.Task.WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);
      var waiting = second.Execute(() => Action(false));
      try
      {
        await redis.Contended.Task.WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);
        Assert.Equal(1, reads);
        Assert.False(waiting.IsCompleted);
      }
      finally
      {
        finish.TrySetResult();
      }

      await Task.WhenAll(running, waiting);

      Assert.Equal(2, reads);
      Assert.Equal(1, writes);
      Assert.Empty(redis.Owners);
    }

    [Fact]
    public async Task DifferentUsersDoNotWaitForOneAnother()
    {
      var redis = new RedisFixture();
      var first = new Request(redis, Guid.NewGuid());
      var second = new Request(redis, Guid.NewGuid());
      var entered = Signal();
      var finish = Signal();
      var running = first.Execute(async () => { entered.SetResult(); await finish.Task; });
      await entered.Task.WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);

      try
      {
        await second.Execute(() => Task.CompletedTask).WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);
        Assert.False(running.IsCompleted);
      }
      finally
      {
        finish.TrySetResult();
        await running;
      }
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    public async Task DifferentActionsAndOverloadsForTheSameUserDoNotWaitForOneAnother(int scenario)
    {
      var redis = new RedisFixture();
      var userId = Guid.NewGuid();
      var first = new Request(redis, userId);
      var second = new Request(redis, userId);
      MethodInfo? firstMethod = null;
      MethodInfo secondMethod;
      switch (scenario)
      {
        case 0:
          secondMethod = typeof(MyOpportunityController).GetMethod(nameof(MyOpportunityController.PerformActionViewed))!;
          break;

        case 1:
          secondMethod = typeof(ReferralController).GetMethod(nameof(ReferralController.ClaimAsRefereeInitiate))!;
          break;

        case 2:
          firstMethod = typeof(MyOpportunityController).GetMethod(nameof(MyOpportunityController.Search), [typeof(MyOpportunitySearchFilterAdmin)])!;
          secondMethod = typeof(MyOpportunityController).GetMethod(nameof(MyOpportunityController.Search), [typeof(MyOpportunitySearchFilter)])!;
          break;

        default:
          throw new NotSupportedException($"Scenario '{scenario}' is not supported");
      }
      var entered = Signal();
      var finish = Signal();
      var running = first.Execute(async () => { entered.SetResult(); await finish.Task; }, method: firstMethod);
      await entered.Task.WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);

      try
      {
        await second.Execute(() => Task.CompletedTask, method: secondMethod)
          .WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);
        Assert.False(running.IsCompleted);
      }
      finally
      {
        finish.TrySetResult();
        await running;
      }
    }

    [Fact]
    public async Task ConcurrentReferralInitiationCreatesOneUsageAndTheSecondRequestIsANoOp()
    {
      var redis = new RedisFixture();
      var userId = Guid.NewGuid();
      var first = new Request(redis, userId);
      var second = new Request(redis, userId);
      var user = new UserBuilder().WithId(userId).Build();
      var link = new ReferralLinkBuilder().Build();
      var usages = new List<ReferralLinkUsage>();
      var entered = Signal();
      var finish = Signal();
      var creates = 0;

      Func<Task> CreateAction()
      {
        var fixture = new LinkUsageServiceFixture();
        fixture.UserService.Setup(service => service.GetByUsername(It.IsAny<string>(), false, false)).Returns(user);
        fixture.LinkService.Setup(service => service.GetById(link.Id, true, false, false, false, false, null)).Returns(link);
        fixture.LinkUsageRepository.Setup(repository => repository.Query()).Returns(() => usages.AsQueryable());
        fixture.LinkUsageRepository.Setup(repository => repository.Create(It.IsAny<ReferralLinkUsage>()))
          .Returns(async (ReferralLinkUsage usage) =>
          {
            creates++;
            entered.TrySetResult();
            await finish.Task;
            usages.Add(usage);
            return usage;
          });
        return () => fixture.Build().ClaimAsRefereeInitiate(link.Id);
      }

      var running = first.Execute(CreateAction());
      await entered.Task.WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);
      var waiting = second.Execute(CreateAction());
      try
      {
        await redis.Contended.Task.WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);
        Assert.Equal(1, creates);
      }
      finally
      {
        finish.TrySetResult();
      }

      await Task.WhenAll(running, waiting);

      Assert.Equal(1, creates);
      var stored = Assert.Single(usages);
      Assert.Equal(userId, stored.UserId);
      Assert.Equal(link.ProgramId, stored.ProgramId);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(75)]
    [InlineData(2000)]
    public async Task BusyRequestUsesConfiguredAcquisitionTimeoutAndDoesNotInvokeTheAction(int acquireTimeoutMilliseconds)
    {
      var redis = new RedisFixture();
      var request = new Request(redis, Guid.NewGuid());
      request.Settings.DistributedLockUserActionAcquireTimeoutInMilliseconds = acquireTimeoutMilliseconds;
      var locks = new Mock<IDistributedLockService>(MockBehavior.Strict);
      locks.Setup(service => service.TryRunWithLockAsync(
          request.LockKey, TimeSpan.FromMinutes(2), TimeSpan.FromMilliseconds(acquireTimeoutMilliseconds),
          It.IsAny<Func<Task>>(), It.IsAny<CancellationToken>(), It.IsAny<string>()))
        .ReturnsAsync(false);
      var executed = false;

      var exception = await Assert.ThrowsAsync<RequestInProgressException>(() => request.Execute(() =>
      {
        executed = true;
        return Task.CompletedTask;
      }, locks.Object));

      Assert.False(executed);
      Assert.Equal("We're still working on your previous request. Just a moment, please.", exception.Message);
    }

    [Fact]
    public async Task NegativeAcquisitionTimeoutDoesNotAcquireALockOrExecuteTheAction()
    {
      var redis = new RedisFixture();
      var request = new Request(redis, Guid.NewGuid());
      request.Settings.DistributedLockUserActionAcquireTimeoutInMilliseconds = -1;
      var executed = false;

      var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => request.Execute(() =>
      {
        executed = true;
        return Task.CompletedTask;
      }));

      Assert.Equal("AppSettings:DistributedLockUserActionAcquireTimeoutInMilliseconds must not be negative.", exception.Message);
      Assert.False(executed);
      redis.Database.Verify(database => database.LockTakeAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(),
        It.IsAny<TimeSpan>(), It.IsAny<CommandFlags>()), Times.Never);
    }

    [Fact]
    public async Task DisconnectedWaitingRequestNeverStartsAndDoesNotReleaseTheActiveOwner()
    {
      var redis = new RedisFixture();
      var userId = Guid.NewGuid();
      var first = new Request(redis, userId);
      var second = new Request(redis, userId);
      using var cancellation = CancellationTokenSource.CreateLinkedTokenSource(TestContext.Current.CancellationToken);
      second.Context.RequestAborted = cancellation.Token;
      var entered = Signal();
      var finish = Signal();
      var executed = false;
      var running = first.Execute(async () => { entered.SetResult(); await finish.Task; });
      await entered.Task.WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);
      var waiting = second.Execute(() => { executed = true; return Task.CompletedTask; });

      try
      {
        await redis.Contended.Task.WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);
        cancellation.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => waiting);
        Assert.False(executed);
        Assert.Single(redis.Owners);
      }
      finally
      {
        finish.TrySetResult();
        await running;
      }

      Assert.Empty(redis.Owners);
      await new Request(redis, userId).Execute(() => Task.CompletedTask);
    }
    #endregion

    #region Lock Tests
    [Fact]
    public async Task BusyLockStopsAtTheShortAcquisitionBudgetWithoutExecutingOrReleasing()
    {
      var redis = new RedisFixture(retryDelayMilliseconds: 1000);
      redis.Database.Setup(database => database.LockTakeAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(),
          It.IsAny<TimeSpan>(), CommandFlags.None))
        .ReturnsAsync(false);
      var executed = false;
      var elapsed = System.Diagnostics.Stopwatch.StartNew();

      var result = await redis.CreateService().TryRunWithLockAsync("busy", TimeSpan.FromMinutes(2),
        TimeSpan.FromMilliseconds(20), () => { executed = true; return Task.CompletedTask; }, TestContext.Current.CancellationToken);

      Assert.False(result);
      Assert.False(executed);
      Assert.True(elapsed.Elapsed < TimeSpan.FromSeconds(2));
      redis.Database.Verify(database => database.LockReleaseAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(),
        It.IsAny<CommandFlags>()), Times.Never);
    }

    [Fact]
    public async Task FailureReleasesTheLockAndAValidRetryCanExecute()
    {
      var redis = new RedisFixture();
      var locks = redis.CreateService();

      await Assert.ThrowsAsync<InvalidOperationException>(() => locks.TryRunWithLockAsync("retry",
        TimeSpan.FromMinutes(2), TimeSpan.Zero, () => throw new InvalidOperationException("Action failed"), TestContext.Current.CancellationToken));
      Assert.Empty(redis.Owners);

      Assert.True(await locks.TryRunWithLockAsync("retry", TimeSpan.FromMinutes(2), TimeSpan.Zero,
        () => Task.CompletedTask, TestContext.Current.CancellationToken));
      Assert.Empty(redis.Owners);
    }

    [Fact]
    public async Task CancellationWhileAcquiringStillReleasesAnAcquiredLock()
    {
      var redis = new RedisFixture();
      using var cancellation = CancellationTokenSource.CreateLinkedTokenSource(TestContext.Current.CancellationToken);
      redis.Database.Setup(database => database.LockTakeAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(),
          It.IsAny<TimeSpan>(), CommandFlags.None))
        .ReturnsAsync(() => { cancellation.Cancel(); return true; });
      var executed = false;

      await Assert.ThrowsAnyAsync<OperationCanceledException>(() => redis.CreateService().TryRunWithLockAsync("cancel",
        TimeSpan.FromMinutes(2), TimeSpan.Zero, () => { executed = true; return Task.CompletedTask; }, cancellation.Token));

      Assert.False(executed);
      redis.Database.Verify(database => database.LockReleaseAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(),
        CommandFlags.None), Times.Once);
    }

    [Fact]
    public async Task ExpiredOwnerCannotReleaseASuccessorsLock()
    {
      var redis = new RedisFixture();
      const string key = "yoma.core.api:locks:expired";

      Assert.True(await redis.CreateService().TryRunWithLockAsync("expired", TimeSpan.FromMinutes(2), TimeSpan.Zero, () =>
      {
        redis.Owners[key] = "successor";
        return Task.CompletedTask;
      }, TestContext.Current.CancellationToken));

      Assert.Equal((RedisValue)"successor", redis.Owners[key]);
      redis.Database.Verify(database => database.KeyDeleteAsync(It.IsAny<RedisKey>(), It.IsAny<CommandFlags>()), Times.Never);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task ReleaseFailureDoesNotReplaceTheActionsOutcome(bool actionFails)
    {
      var redis = new RedisFixture();
      redis.Database.Setup(database => database.LockReleaseAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(), CommandFlags.None))
        .ThrowsAsync(new InvalidOperationException("Release failed"));

      Task<bool> Execute() => redis.CreateService().TryRunWithLockAsync("release", TimeSpan.FromMinutes(2), TimeSpan.Zero,
        () => actionFails ? throw new InvalidOperationException("Action failed") : Task.CompletedTask, TestContext.Current.CancellationToken);

      if (actionFails)
        Assert.Equal("Action failed", (await Assert.ThrowsAsync<InvalidOperationException>(Execute)).Message);
      else
        Assert.True(await Execute());
    }

    [Fact]
    public async Task RedisAcquisitionFailureDoesNotExecuteTheActionUnlocked()
    {
      var redis = new RedisFixture();
      redis.Database.Setup(database => database.LockTakeAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(),
          It.IsAny<TimeSpan>(), CommandFlags.None))
        .ThrowsAsync(new InvalidOperationException("Redis unavailable"));
      var executed = false;

      await Assert.ThrowsAsync<InvalidOperationException>(() => redis.CreateService().TryRunWithLockAsync("redis-down",
        TimeSpan.FromMinutes(2), TimeSpan.Zero, () => { executed = true; return Task.CompletedTask; }, TestContext.Current.CancellationToken));

      Assert.False(executed);
    }
    #endregion

    #region Fixtures
    private static TaskCompletionSource Signal() => new(TaskCreationOptions.RunContinuationsAsynchronously);

    private sealed class Request
    {
      private static readonly MethodInfo DefaultAction = typeof(MyOpportunityController)
        .GetMethod(nameof(MyOpportunityController.PerformActionInstantVerification))!;
      internal Guid UserId { get; }
      internal string LockKey => $"api_user_action:{UserId}:{DefaultAction.DeclaringType!.FullName}:scope:{nameof(MyOpportunityController.PerformActionSendForVerificationManual)}";
      internal Mock<IHttpContextAccessor> Accessor { get; } = MockHttpContextAccessor.Create();
      internal Mock<IUserService> Users { get; } = new();
      internal AppSettings Settings { get; } = new()
      {
        DistributedLockUserActionAcquireTimeoutInMilliseconds = 2000,
        DistributedLockUserActionLeaseDurationInSeconds = 120
      };
      internal HttpContext Context => Accessor.Object.HttpContext!;
      private readonly RedisFixture _redis;

      internal Request(RedisFixture redis, Guid userId)
      {
        _redis = redis;
        UserId = userId;
        Context.RequestAborted = TestContext.Current.CancellationToken;
        Users.Setup(service => service.GetByUsername(It.IsAny<string>(), false, false))
          .Returns(new UserBuilder().WithId(userId).Build());
      }

      internal Task Execute(Func<Task> action, IDistributedLockService? locks = null, MethodInfo? method = null)
      {
        method ??= DefaultAction;
        var descriptor = new ControllerActionDescriptor
        {
          ControllerName = method.DeclaringType!.Name,
          ActionName = method.Name,
          ControllerTypeInfo = method.DeclaringType.GetTypeInfo(),
          MethodInfo = method
        };
        var context = new ActionContext(Context, new RouteData(), descriptor);
        var executing = new ActionExecutingContext(context, [], new Dictionary<string, object?>(), new object());
        var filter = new UserActionLockFilter(Options.Create(Settings), Accessor.Object, Users.Object, locks ?? _redis.CreateService());
        return filter.OnActionExecutionAsync(executing, async () =>
        {
          await action();
          return new ActionExecutedContext(context, [], new object());
        });
      }
    }

    private sealed class RedisFixture
    {
      internal Mock<IDatabase> Database { get; } = new();
      internal Dictionary<string, RedisValue> Owners { get; } = [];
      internal TaskCompletionSource Contended { get; } = Signal();
      private readonly Mock<IConnectionMultiplexer> _connection = new();
      private readonly int _retryDelayMilliseconds;
      private readonly Lock _gate = new();

      internal RedisFixture(int retryDelayMilliseconds = 5)
      {
        _retryDelayMilliseconds = retryDelayMilliseconds;
        _connection.Setup(connection => connection.GetDatabase(It.IsAny<int>(), It.IsAny<object?>())).Returns(Database.Object);
        Database.Setup(database => database.LockTakeAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(),
            It.IsAny<TimeSpan>(), CommandFlags.None))
          .ReturnsAsync((RedisKey key, RedisValue owner, TimeSpan _, CommandFlags _) =>
          {
            lock (_gate)
            {
              if (Owners.TryAdd(key.ToString(), owner)) return true;
              Contended.TrySetResult();
              return false;
            }
          });
        Database.Setup(database => database.LockReleaseAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(), CommandFlags.None))
          .ReturnsAsync((RedisKey key, RedisValue owner, CommandFlags _) =>
          {
            lock (_gate)
            {
              return Owners.TryGetValue(key.ToString(), out var current) && current == owner && Owners.Remove(key.ToString());
            }
          });
      }

      internal DistributedLockService CreateService() => new(Mock.Of<ILogger<DistributedLockService>>(),
        Options.Create(new AppSettings { DistributedLockRetryDelayInMilliseconds = _retryDelayMilliseconds }), _connection.Object);
    }
    #endregion
  }
}
