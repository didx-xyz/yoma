using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Moq;
using Npgsql;
using StackExchange.Redis;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Reflection;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Xunit;
using Yoma.Core.Api.Controllers;
using Yoma.Core.Api.Middleware;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Domain.Referral;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Test.Referral.Builders;
using Yoma.Core.Test.Referral.Fixtures;

namespace Yoma.Core.Test.Core
{
  /// <summary>
  /// Exercises the actual controllers, MVC filter and lock service through two HTTP test hosts and Redis connections.
  /// PostgreSQL is a constrained test ledger, not the production EF schema. Referral initiation uses its real domain
  /// service with a SQL-backed repository double; other business side effects are deliberately stubbed.
  /// No provider, wallet, reward or notification integration is exercised here.
  /// </summary>
  public class UserActionLockIntegrationTests(ITestOutputHelper output)
  {
    #region Tests
    [Theory]
    [InlineData(false, 2, false)]
    [InlineData(true, 2, false)]
    [InlineData(false, 2, true)]
    [InlineData(true, 2, true)]
    [InlineData(false, 32, true)]
    [InlineData(true, 32, true)]
    public async Task ConcurrentRequestsAcrossHostsRecheckCommittedStateWithoutDuplicateWrites(bool referral, int count, bool distinctLinks)
    {
      await using var fixture = await Fixture.Create();
      fixture.DistinctLinks = distinctLinks;
      var user = Guid.NewGuid();
      var pause = fixture.Pause(user);
      var running = fixture.Send(0, user, referral, TestContext.Current.CancellationToken);
      await pause.Entered.Task.WaitAsync(TimeSpan.FromSeconds(10), TestContext.Current.CancellationToken);
      var elapsed = Stopwatch.StartNew();
      var contenders = Enumerable.Range(1, count - 1).Select(index => fixture.Send(index % 2, user, referral, TestContext.Current.CancellationToken)).ToArray();
      await Task.Delay(100, TestContext.Current.CancellationToken);
      pause.Finish.TrySetResult();
      var responses = await Task.WhenAll(contenders.Prepend(running));

      try
      {
        Assert.All(responses, response => Assert.True(response.StatusCode is HttpStatusCode.OK or HttpStatusCode.Conflict));
        if (count == 2) Assert.All(responses, response => Assert.Equal(HttpStatusCode.OK, response.StatusCode));
        Assert.Equal(1, await fixture.Count());
        Assert.False(await fixture.HasLock(user, referral));
        output.WriteLine($"{count} requests; referral={referral}; OK={responses.Count(value => value.IsSuccessStatusCode)}; " +
          $"conflicts={responses.Count(value => value.StatusCode == HttpStatusCode.Conflict)}; elapsed={elapsed.ElapsedMilliseconds}ms");
      }
      finally
      {
        foreach (var response in responses) response.Dispose();
      }
    }

    [Theory]
    [InlineData("view")]
    [InlineData("save")]
    [InlineData("navigateExternalLink")]
    public async Task AdditionalReviewedMyOpportunityActionsSerializeTheirReadBeforeInsert(string action)
    {
      await using var fixture = await Fixture.Create();
      var user = Guid.NewGuid();
      var pause = fixture.Pause(user);
      var running = fixture.SendMyOpportunityAction(0, user, action, TestContext.Current.CancellationToken);
      await pause.Entered.Task.WaitAsync(TimeSpan.FromSeconds(10), TestContext.Current.CancellationToken);
      var waiting = fixture.SendMyOpportunityAction(1, user, action, TestContext.Current.CancellationToken);
      try
      {
        await Task.Delay(100, TestContext.Current.CancellationToken);
        Assert.False(waiting.IsCompleted);
      }
      finally
      {
        pause.Finish.TrySetResult();
      }
      var responses = await Task.WhenAll(running, waiting);
      try
      {
        // The navigation fixture returns null sync info; MVC preserves its existing 204 response.
        var expected = action == "navigateExternalLink" ? HttpStatusCode.NoContent : HttpStatusCode.OK;
        Assert.All(responses, response => Assert.Equal(expected, response.StatusCode));
        Assert.Equal(1, await fixture.Count());
      }
      finally
      {
        foreach (var response in responses) response.Dispose();
      }
    }

    [Theory]
    [InlineData("save-remove")]
    [InlineData("manual")]
    [InlineData("manual-delete")]
    [InlineData("profile")]
    [InlineData("onboard")]
    [InlineData("organization")]
    public async Task FurtherReviewedRoutesHoldTheGuardThroughTheControllerInvocation(string action)
    {
      await using var fixture = await Fixture.Create();
      var user = Guid.NewGuid();
      var pause = fixture.Pause(user);
      var running = fixture.SendFurtherAction(0, user, action, TestContext.Current.CancellationToken);
      await pause.Entered.Task.WaitAsync(TimeSpan.FromSeconds(10), TestContext.Current.CancellationToken);
      var waiting = fixture.SendFurtherAction(1, user, action, TestContext.Current.CancellationToken);
      try
      {
        await Task.Delay(100, TestContext.Current.CancellationToken);
        Assert.False(waiting.IsCompleted);
      }
      finally
      {
        pause.Finish.TrySetResult();
      }
      var responses = await Task.WhenAll(running, waiting);
      try
      {
        // These business operations use ledger doubles: verify routing, binding and gate ordering, not domain outcomes.
        Assert.All(responses, response => Assert.Equal(HttpStatusCode.OK, response.StatusCode));
        Assert.Equal(1, await fixture.Count());
      }
      finally
      {
        foreach (var response in responses) response.Dispose();
      }
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task ReferralClaimAndInitiationShareALockInEitherOrder(bool claimFirst)
    {
      await using var fixture = await Fixture.Create();
      var user = Guid.NewGuid();
      var pause = fixture.Pause(user);
      var running = fixture.SendReferralClaim(0, user, claimFirst, TestContext.Current.CancellationToken);
      await pause.Entered.Task.WaitAsync(TimeSpan.FromSeconds(10), TestContext.Current.CancellationToken);
      var waiting = fixture.SendReferralClaim(1, user, !claimFirst, TestContext.Current.CancellationToken);
      try
      {
        await Task.Delay(100, TestContext.Current.CancellationToken);
        Assert.False(waiting.IsCompleted);
      }
      finally
      {
        pause.Finish.TrySetResult();
      }
      var responses = await Task.WhenAll(running, waiting);
      try
      {
        Assert.All(responses, response => Assert.Equal(HttpStatusCode.OK, response.StatusCode));
        Assert.Equal(1, await fixture.Count());
        Assert.False(await fixture.HasLock(user, true));
      }
      finally
      {
        foreach (var response in responses) response.Dispose();
      }
    }

    [Fact]
    public async Task DifferentUsersAndActionsRemainIndependentWhileOneActionIsPaused()
    {
      await using var fixture = await Fixture.Create();
      var user = Guid.NewGuid();
      var pause = fixture.Pause(user);
      var running = fixture.Send(0, user, false, TestContext.Current.CancellationToken);
      await pause.Entered.Task.WaitAsync(TimeSpan.FromSeconds(10), TestContext.Current.CancellationToken);
      try
      {
        using var differentUser = await fixture.Send(1, Guid.NewGuid(), false, TestContext.Current.CancellationToken).WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);
        using var differentAction = await fixture.Send(1, user, true, TestContext.Current.CancellationToken).WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, differentUser.StatusCode);
        Assert.Equal(HttpStatusCode.OK, differentAction.StatusCode);
        Assert.False(running.IsCompleted);
      }
      finally
      {
        pause.Finish.TrySetResult();
        (await running).Dispose();
      }
      Assert.Equal(3, await fixture.Count());
    }

    [Fact]
    public async Task BusyRequestReturnsConflictThroughSharedMiddlewareAndDoesNotReleaseTheOwner()
    {
      await using var fixture = await Fixture.Create();
      var user = Guid.NewGuid();
      var pause = fixture.Pause(user);
      var running = fixture.Send(0, user, false, TestContext.Current.CancellationToken);
      await pause.Entered.Task.WaitAsync(TimeSpan.FromSeconds(10), TestContext.Current.CancellationToken);
      try
      {
        var elapsed = Stopwatch.StartNew();
        using var busy = await fixture.Send(1, user, false, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Conflict, busy.StatusCode);
        var body = await busy.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.Contains("RequestInProgressException", body, StringComparison.Ordinal);
        Assert.Contains("We're still working on your previous request. Just a moment, please.", body, StringComparison.Ordinal);
        Assert.True(await fixture.HasLock(user, false));
        Assert.Equal(1, fixture.InstantDispatches);
        Assert.InRange(elapsed.ElapsedMilliseconds, 1500, 5000);
      }
      finally
      {
        pause.Finish.TrySetResult();
        (await running).Dispose();
      }
      using var retry = await fixture.Send(1, user, false, TestContext.Current.CancellationToken);
      Assert.Equal(HttpStatusCode.OK, retry.StatusCode);
      Assert.Equal(1, await fixture.Count());
    }

    [Fact]
    public async Task FailedTransactionRollsBackAndASecondHostCanRetry()
    {
      await using var fixture = await Fixture.Create();
      var user = Guid.NewGuid();
      var pause = fixture.Pause(user, fail: true);
      pause.Finish.SetResult();
      using var failed = await fixture.Send(0, user, false, TestContext.Current.CancellationToken);
      Assert.Equal(HttpStatusCode.InternalServerError, failed.StatusCode);
      Assert.Equal(0, await fixture.Count());
      Assert.False(await fixture.HasLock(user, false));
      using var retry = await fixture.Send(1, user, false, TestContext.Current.CancellationToken);
      Assert.Equal(HttpStatusCode.OK, retry.StatusCode);
      Assert.Equal(1, await fixture.Count());
    }

    [Fact]
    public async Task CancelledWaitingHttpRequestDoesNotRunOrReleaseAnotherRequestsLock()
    {
      await using var fixture = await Fixture.Create();
      var user = Guid.NewGuid();
      var pause = fixture.Pause(user);
      var running = fixture.Send(0, user, false, TestContext.Current.CancellationToken);
      await pause.Entered.Task.WaitAsync(TimeSpan.FromSeconds(10), TestContext.Current.CancellationToken);
      try
      {
        using var cancellation = CancellationTokenSource.CreateLinkedTokenSource(TestContext.Current.CancellationToken);
        cancellation.CancelAfter(TimeSpan.FromMilliseconds(100));
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => fixture.Send(1, user, false, cancellation.Token));
        Assert.True(await fixture.HasLock(user, false));
        Assert.Equal(1, fixture.InstantDispatches);
      }
      finally
      {
        pause.Finish.TrySetResult();
        (await running).Dispose();
      }
      Assert.Equal(1, await fixture.Count());
    }

    [Fact]
    public async Task AbandonedLeaseExpiresAndAnExpiredOwnerCannotDeleteItsSuccessor()
    {
      await using var fixture = await Fixture.Create();
      var key = $"test:user_action:{Guid.NewGuid()}";
      var redisKey = $"yoma.core.api:locks:{key}";
      var database = fixture.Connections[0].GetDatabase();
      var firstEntered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
      var finishFirst = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
      var secondEntered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
      var finishSecond = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
      var first = fixture.Locks(0).TryRunWithLockAsync(key, TimeSpan.FromMilliseconds(150), TimeSpan.Zero,
        async () => { firstEntered.SetResult(); await finishFirst.Task; }, TestContext.Current.CancellationToken);
      await firstEntered.Task;
      await Task.Delay(300, TestContext.Current.CancellationToken);
      var second = fixture.Locks(1).TryRunWithLockAsync(key, TimeSpan.FromSeconds(10), TimeSpan.Zero,
        async () => { secondEntered.SetResult(); await finishSecond.Task; }, TestContext.Current.CancellationToken);
      try
      {
        await secondEntered.Task.WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);
        finishFirst.TrySetResult();
        Assert.True(await first);
        Assert.True(await database.KeyExistsAsync(redisKey));
        finishSecond.TrySetResult();
        Assert.True(await second);
        Assert.False(await database.KeyExistsAsync(redisKey));
      }
      finally
      {
        finishFirst.TrySetResult();
        finishSecond.TrySetResult();
        await Task.WhenAll(first, second);
        await database.KeyDeleteAsync(redisKey);
      }
    }
    #endregion

    #region Fixtures
    private sealed class Pause
    {
      internal TaskCompletionSource Entered { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
      internal TaskCompletionSource Finish { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
      internal bool Fail { get; init; }
    }

    private sealed class Fixture : IAsyncDisposable
    {
      private readonly string _postgres;
      private readonly Guid _runId = Guid.NewGuid();
      private readonly Guid _targetId = Guid.NewGuid();
      private readonly Guid _linkId = Guid.NewGuid();
      private readonly ConcurrentDictionary<Guid, Pause> _pauses = new();
      private readonly ConcurrentBag<Pause> _allPauses = [];
      private readonly ConcurrentDictionary<string, byte> _keys = new();
      private readonly List<IHost> _hosts = [];
      private readonly List<HttpClient> _clients = [];
      private int _instantDispatches;
      internal int InstantDispatches => Volatile.Read(ref _instantDispatches);
      internal List<ConnectionMultiplexer> Connections { get; } = [];
      internal bool DistinctLinks { get; set; } = true;
      private readonly AppSettings _settings = new()
      {
        DistributedLockRetryDelayInMilliseconds = 200,
        DistributedLockUserActionAcquireTimeoutInMilliseconds = 2000,
        DistributedLockUserActionLeaseDurationInSeconds = 120
      };

      private Fixture(string postgres) => _postgres = postgres;

      internal static async Task<Fixture> Create()
      {
        var postgres = System.Environment.GetEnvironmentVariable("YOMA_USER_ACTION_TEST_POSTGRES");
        var redis = System.Environment.GetEnvironmentVariable("YOMA_USER_ACTION_TEST_REDIS");
        if (string.IsNullOrWhiteSpace(postgres) || string.IsNullOrWhiteSpace(redis))
          Assert.Skip("Set YOMA_USER_ACTION_TEST_POSTGRES and YOMA_USER_ACTION_TEST_REDIS to disposable local test storage.");
        var builder = new NpgsqlConnectionStringBuilder(postgres);
        if (builder.Host is not ("127.0.0.1" or "localhost") ||
          builder.Database?.StartsWith("yoma_request_lock_", StringComparison.Ordinal) != true)
          throw new InvalidOperationException("The concurrency fixture only accepts an isolated local yoma_request_lock_* database.");
        var cache = ConfigurationOptions.Parse(redis);
        if (cache.EndPoints.Any(endpoint => !(endpoint is IPEndPoint ip && IPAddress.IsLoopback(ip.Address)) &&
          !(endpoint is DnsEndPoint dns && dns.Host is "127.0.0.1" or "localhost")))
          throw new InvalidOperationException("The concurrency fixture only accepts a disposable loopback cache.");
        var result = new Fixture(postgres);
        try
        {
          await using var connection = new NpgsqlConnection(postgres);
          await connection.OpenAsync(TestContext.Current.CancellationToken);
          await using var command = new NpgsqlCommand("""
            CREATE TABLE IF NOT EXISTS public."UserActionLockTest" (
              "RunId" uuid NOT NULL, "Action" text NOT NULL, "UserId" uuid NOT NULL,
              "EntityId" uuid NOT NULL, "LinkId" uuid NOT NULL,
              PRIMARY KEY ("RunId", "Action", "UserId", "EntityId"));
            """, connection);
          await command.ExecuteNonQueryAsync(TestContext.Current.CancellationToken);
          for (var index = 0; index < 2; index++)
          {
            result.Connections.Add(await ConnectionMultiplexer.ConnectAsync(cache));
            await result.AddHost(index);
          }
          return result;
        }
        catch
        {
          await result.DisposeAsync();
          throw;
        }
      }

      internal Pause Pause(Guid user, bool fail = false)
      {
        var pause = new Pause { Fail = fail };
        if (!_pauses.TryAdd(user, pause)) throw new InvalidOperationException("Pause already registered");
        _allPauses.Add(pause);
        return pause;
      }

      internal DistributedLockService Locks(int host) => new(Mock.Of<ILogger<DistributedLockService>>(), Options.Create(_settings), Connections[host]);

      internal Task<HttpResponseMessage> Send(int host, Guid user, bool referral, CancellationToken cancellationToken)
      {
        var method = referral ? typeof(ReferralController).GetMethod(nameof(ReferralController.ClaimAsRefereeInitiate))! :
          typeof(MyOpportunityController).GetMethod(nameof(MyOpportunityController.PerformActionInstantVerification))!;
        _keys.TryAdd(RedisKeyFor(user, method), 0);
        // Distinct links still share the same opportunity/programme and user-action lock.
        var link = DistinctLinks ? Guid.NewGuid() : _linkId;
        var path = referral ? $"/api/v3/referral/link/{link}/claim/initiate" : $"/api/v3/myopportunity/action/link/{link}/verify";
        var request = new HttpRequestMessage(referral ? HttpMethod.Post : HttpMethod.Put, path);
        request.Headers.Add("X-Test-User", user.ToString());
        return SendAndDisposeRequest(_clients[host], request, cancellationToken);
      }

      internal Task<bool> HasLock(Guid user, bool referral)
      {
        var method = referral ? typeof(ReferralController).GetMethod(nameof(ReferralController.ClaimAsRefereeInitiate))! :
          typeof(MyOpportunityController).GetMethod(nameof(MyOpportunityController.PerformActionInstantVerification))!;
        return Connections[0].GetDatabase().KeyExistsAsync(RedisKeyFor(user, method));
      }

      internal Task<HttpResponseMessage> SendReferralClaim(int host, Guid user, bool claim, CancellationToken cancellationToken)
      {
        if (!claim) return Send(host, user, true, cancellationToken);
        var method = typeof(ReferralController).GetMethod(nameof(ReferralController.ClaimAsReferee))!;
        _keys.TryAdd(RedisKeyFor(user, method), 0);
        var request = new HttpRequestMessage(HttpMethod.Post, $"/api/v3/referral/link/{Guid.NewGuid()}/claim");
        request.Headers.Add("X-Test-User", user.ToString());
        return SendAndDisposeRequest(_clients[host], request, cancellationToken);
      }

      internal Task<HttpResponseMessage> SendMyOpportunityAction(int host, Guid user, string action, CancellationToken cancellationToken)
      {
        var methodName = action switch
        {
          "view" => nameof(MyOpportunityController.PerformActionViewed),
          "save" => nameof(MyOpportunityController.PerformActionSaved),
          "navigateExternalLink" => nameof(MyOpportunityController.PerformActionNavigatedExternalLink),
          _ => throw new NotSupportedException($"Action '{action}' is not supported")
        };
        var method = typeof(MyOpportunityController).GetMethod(methodName)!;
        _keys.TryAdd(RedisKeyFor(user, method), 0);
        var request = new HttpRequestMessage(HttpMethod.Put, $"/api/v3/myopportunity/action/{_targetId}/{action}");
        request.Headers.Add("X-Test-User", user.ToString());
        return SendAndDisposeRequest(_clients[host], request, cancellationToken);
      }

      internal Task<HttpResponseMessage> SendFurtherAction(int host, Guid user, string action, CancellationToken cancellationToken)
      {
        var (controller, name, verb, path) = action switch
        {
          "save-remove" => (typeof(MyOpportunityController), nameof(MyOpportunityController.PerformActionSavedRemove), HttpMethod.Delete, $"/api/v3/myopportunity/action/{_targetId}/save/remove"),
          "manual" => (typeof(MyOpportunityController), nameof(MyOpportunityController.PerformActionSendForVerificationManual), HttpMethod.Put, $"/api/v3/myopportunity/action/{_targetId}/verify"),
          "manual-delete" => (typeof(MyOpportunityController), nameof(MyOpportunityController.PerformActionSendForVerificationManualDelete), HttpMethod.Delete, $"/api/v3/myopportunity/action/{_targetId}/verify/delete"),
          "profile" => (typeof(UserController), nameof(UserController.UpdateProfile), HttpMethod.Patch, "/api/v3/user"),
          "onboard" => (typeof(UserController), nameof(UserController.YoIDOnboard), HttpMethod.Patch, "/api/v3/user/yoId"),
          "organization" => (typeof(OrganizationController), nameof(OrganizationController.Create), HttpMethod.Post, "/api/v3/organization"),
          _ => throw new NotSupportedException($"Action '{action}' is not supported")
        };
        _keys.TryAdd(RedisKeyFor(user, controller.GetMethod(name)!), 0);
        var request = new HttpRequestMessage(verb, path);
        request.Headers.Add("X-Test-User", user.ToString());
        if (action == "profile")
          request.Content = JsonContent.Create(new UserRequestUpdateProfile { FirstName = "Test", Surname = "User" });
        else if (action is "manual" or "organization")
        {
          var form = new MultipartFormDataContent();
          request.Content = form;
          if (action == "manual") form.Add(new StringContent("Test evidence"), "Feedback");
          else
          {
            foreach (var field in new Dictionary<string, string>
            {
              ["Name"] = "Test organization",
              ["PrimaryContactName"] = "Test User",
              ["PrimaryContactEmail"] = "test@example.invalid",
              ["PrimaryContactPhone"] = "+27000000000",
              ["City"] = "Test",
              ["CountryId"] = Guid.NewGuid().ToString(),
              ["StreetAddress"] = "Test",
              ["Province"] = "Test",
              ["PostalCode"] = "0000",
              ["ProviderTypes"] = Guid.NewGuid().ToString(),
              ["AddCurrentUserAsAdmin"] = "true"
            }) form.Add(new StringContent(field.Value), field.Key);
            form.Add(new StringContent("Test document"), "RegistrationDocuments", "test.txt");
          }
        }
        return SendAndDisposeRequest(_clients[host], request, cancellationToken);
      }

      internal async Task<int> Count()
      {
        await using var connection = new NpgsqlConnection(_postgres);
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var command = new NpgsqlCommand("SELECT count(*) FROM public.\"UserActionLockTest\" WHERE \"RunId\" = @run", connection);
        command.Parameters.AddWithValue("run", _runId);
        return Convert.ToInt32(await command.ExecuteScalarAsync(TestContext.Current.CancellationToken));
      }

      public async ValueTask DisposeAsync()
      {
        foreach (var pause in _allPauses) pause.Finish.TrySetResult();
        foreach (var client in _clients) client.Dispose();
        foreach (var host in _hosts) host.Dispose();
        if (Connections.Count > 0 && !_keys.IsEmpty)
          await Connections[0].GetDatabase().KeyDeleteAsync([.. _keys.Keys.Select(value => (RedisKey)value)]);
        foreach (var connection in Connections) await connection.DisposeAsync();
        await using var postgres = new NpgsqlConnection(_postgres);
        await postgres.OpenAsync();
        await using var command = new NpgsqlCommand("DELETE FROM public.\"UserActionLockTest\" WHERE \"RunId\" = @run", postgres);
        command.Parameters.AddWithValue("run", _runId);
        await command.ExecuteNonQueryAsync();
      }

      private async Task AddHost(int index)
      {
        var host = new HostBuilder().ConfigureWebHost(builder => builder.UseTestServer().ConfigureServices(services =>
        {
          services.AddLogging();
          services.AddHttpContextAccessor();
          services.AddSingleton<IOptions<AppSettings>>(Options.Create(_settings));
          services.AddSingleton<IDistributedLockService>(Locks(index));
          services.AddSingleton(Mock.Of<IBlockService>());
          services.AddSingleton(Mock.Of<IProgramService>());
          services.AddSingleton(Mock.Of<IProgramInfoService>());
          services.AddSingleton(Mock.Of<ILinkService>());
          services.AddSingleton(Mock.Of<IBlockReasonService>());
          services.AddSingleton(Mock.Of<IAnalyticsService>());
          services.AddSingleton(Mock.Of<IOrganizationProviderTypeService>());
          services.AddSingleton(Mock.Of<IUserGoalService>());
          var users = new Mock<IUserService>();
          users.Setup(value => value.GetByUsername(It.IsAny<string>(), false, false))
            .Returns((string username, bool _, bool _) => new UserBuilder().WithId(Guid.Parse(username)).Build());
          services.AddSingleton(users.Object);
          services.AddScoped(provider =>
          {
            var accessor = provider.GetRequiredService<IHttpContextAccessor>();
            var user = Guid.Parse(accessor.HttpContext!.User.Identity!.Name!);
            var service = new Mock<IMyOpportunityService>();
            service.Setup(value => value.PerformActionInstantVerification(It.IsAny<Guid>())).Returns(async (Guid link) =>
            {
              Interlocked.Increment(ref _instantDispatches);
              if (Read("instant", user).Count == 0) await Insert("instant", user, link);
            });
            service.Setup(value => value.PerformActionViewed(It.IsAny<Guid>())).Returns((Guid opportunity) => ApplyOnce("view", user, opportunity));
            service.Setup(value => value.PerformActionSaved(It.IsAny<Guid>())).Returns((Guid opportunity) => ApplyOnce("save", user, opportunity));
            service.Setup(value => value.PerformActionSavedRemove(It.IsAny<Guid>())).Returns((Guid opportunity) => ApplyOnce("save-remove", user, opportunity));
            service.Setup(value => value.PerformActionSendForVerificationManual(It.IsAny<Guid>(), It.IsAny<MyOpportunityRequestVerify>()))
              .Returns((Guid opportunity, MyOpportunityRequestVerify _) => ApplyOnce("manual", user, opportunity));
            service.Setup(value => value.PerformActionDeleteVerificationManual(It.IsAny<Guid>())).Returns((Guid opportunity) => ApplyOnce("manual-delete", user, opportunity));
            service.Setup(value => value.PerformActionNavigatedExternalLink(It.IsAny<Guid>())).Returns(async (Guid opportunity) =>
            {
              await ApplyOnce("navigateExternalLink", user, opportunity);
              return (SyncInfoEntityPartner?)null;
            });
            return service.Object;
          });
          services.AddScoped(provider =>
          {
            var user = Guid.Parse(provider.GetRequiredService<IHttpContextAccessor>().HttpContext!.User.Identity!.Name!);
            var service = new Mock<IUserProfileService>();
            service.Setup(value => value.Update(It.IsAny<UserRequestUpdateProfile>())).Returns(async (UserRequestUpdateProfile _) =>
            {
              await ApplyOnce("profile", user, _targetId);
              return new UserProfile { Id = user };
            });
            service.Setup(value => value.YoIDOnboard()).Returns(async () =>
            {
              await ApplyOnce("onboard", user, _targetId);
              return new UserProfile { Id = user };
            });
            return service.Object;
          });
          services.AddScoped(provider =>
          {
            var user = Guid.Parse(provider.GetRequiredService<IHttpContextAccessor>().HttpContext!.User.Identity!.Name!);
            var service = new Mock<IOrganizationService>();
            service.Setup(value => value.Create(It.IsAny<OrganizationRequestCreate>())).Returns(async (OrganizationRequestCreate request) =>
            {
              await ApplyOnce("organization", user, _targetId);
              return new Organization { Id = _targetId, Name = request.Name };
            });
            return service.Object;
          });
          services.AddScoped<ILinkUsageService>(provider =>
          {
            var user = Guid.Parse(provider.GetRequiredService<IHttpContextAccessor>().HttpContext!.User.Identity!.Name!);
            var fixture = new LinkUsageServiceFixture(user.ToString(), Constants.Role_User);
            fixture.UserService.Setup(value => value.GetByUsername(It.IsAny<string>(), false, false)).Returns(new UserBuilder().WithId(user).Build());
            fixture.LinkService.Setup(value => value.GetById(It.IsAny<Guid>(), true, false, false, false, false, null))
              .Returns((Guid link, bool _, bool _, bool _, bool _, bool _, LockMode? _) =>
                new ReferralLinkBuilder().WithId(link).WithProgramId(_targetId).Build());
            fixture.LinkUsageRepository.Setup(value => value.Query()).Returns(() => Read("referral", user).AsQueryable());
            fixture.LinkUsageRepository.Setup(value => value.Create(It.IsAny<ReferralLinkUsage>())).Returns(async (ReferralLinkUsage usage) =>
            {
              await Insert("referral", user, usage.LinkId);
              return usage;
            });
            var initiation = fixture.Build();
            var service = new Mock<ILinkUsageService>();
            service.Setup(value => value.ClaimAsRefereeInitiate(It.IsAny<Guid>())).Returns((Guid link) => initiation.ClaimAsRefereeInitiate(link));
            service.Setup(value => value.ClaimAsReferee(It.IsAny<Guid>())).Returns((Guid link) => ApplyOnce("referral", user, link));
            return service.Object;
          });
          services.AddAuthentication("Test").AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>("Test", _ => { });
          var policy = typeof(MyOpportunityController).GetCustomAttribute<AuthorizeAttribute>()!.Policy!;
          services.AddAuthorizationBuilder().AddPolicy(policy, value => value.RequireAuthenticatedUser());
          services.AddControllers().AddApplicationPart(typeof(MyOpportunityController).Assembly);
        }).Configure(app =>
        {
          app.UseMiddleware<ExceptionResponseMiddleware>();
          app.UseMiddleware<ExceptionLogMiddleware>();
          app.UseRouting();
          app.UseAuthentication();
          app.UseAuthorization();
          app.UseEndpoints(endpoints => endpoints.MapControllers());
        })).Build();
        _hosts.Add(host);
        await host.StartAsync(TestContext.Current.CancellationToken);
        _clients.Add(host.GetTestClient());
      }

      private List<ReferralLinkUsage> Read(string action, Guid user)
      {
        using var connection = new NpgsqlConnection(_postgres);
        connection.Open();
        using var command = new NpgsqlCommand("SELECT \"LinkId\" FROM public.\"UserActionLockTest\" WHERE \"RunId\" = @run AND \"Action\" = @action AND \"UserId\" = @user", connection);
        command.Parameters.AddWithValue("run", _runId);
        command.Parameters.AddWithValue("action", action);
        command.Parameters.AddWithValue("user", user);
        using var reader = command.ExecuteReader();
        List<ReferralLinkUsage> result = [];
        while (reader.Read()) result.Add(new ReferralLinkUsage
        {
          UserId = user,
          ProgramId = _targetId,
          LinkId = reader.GetGuid(0),
          Status = ReferralLinkUsageStatus.Initiated
        });
        return result;
      }

      private Task ApplyOnce(string action, Guid user, Guid reference) => Read(action, user).Count == 0 ? Insert(action, user, reference) : Task.CompletedTask;

      private static string RedisKeyFor(Guid user, MethodInfo method)
      {
        var scope = method.GetCustomAttribute<UserActionLockAttribute>()?.Scope;
        var action = scope == null ? method.ToString() : $"scope:{scope}";
        return $"yoma.core.api:locks:api_user_action:{user}:{method.DeclaringType!.FullName}:{action}";
      }

      private async Task Insert(string action, Guid user, Guid link)
      {
        await using var connection = new NpgsqlConnection(_postgres);
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(TestContext.Current.CancellationToken);
        await using var command = new NpgsqlCommand("INSERT INTO public.\"UserActionLockTest\" VALUES (@run, @action, @user, @target, @link)", connection, transaction);
        command.Parameters.AddWithValue("run", _runId);
        command.Parameters.AddWithValue("action", action);
        command.Parameters.AddWithValue("user", user);
        command.Parameters.AddWithValue("target", _targetId);
        command.Parameters.AddWithValue("link", link);
        await command.ExecuteNonQueryAsync(TestContext.Current.CancellationToken);
        if (_pauses.TryRemove(user, out var pause))
        {
          pause.Entered.TrySetResult();
          await pause.Finish.Task.WaitAsync(TimeSpan.FromSeconds(15), TestContext.Current.CancellationToken);
          if (pause.Fail) throw new InvalidOperationException("Deliberate transaction rollback");
        }
        await transaction.CommitAsync(TestContext.Current.CancellationToken);
      }

      private static async Task<HttpResponseMessage> SendAndDisposeRequest(HttpClient client, HttpRequestMessage request, CancellationToken cancellationToken)
      {
        using (request) return await client.SendAsync(request,
          cancellationToken == default ? TestContext.Current.CancellationToken : cancellationToken);
      }
    }

    private sealed class TestAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,
      ILoggerFactory logger, UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
      protected override Task<AuthenticateResult> HandleAuthenticateAsync()
      {
        if (!Guid.TryParse(Request.Headers["X-Test-User"], out var user)) return Task.FromResult(AuthenticateResult.NoResult());
        var identity = new ClaimsIdentity([new Claim(ClaimTypes.Name, user.ToString()), new Claim(Constants.ClaimType_Role, Constants.Role_User)],
          "Test", ClaimTypes.Name, Constants.ClaimType_Role);
        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), "Test")));
      }
    }
    #endregion
  }
}
