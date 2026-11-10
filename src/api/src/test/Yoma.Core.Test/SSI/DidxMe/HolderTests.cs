using Flurl.Http;
using Flurl.Http.Newtonsoft;
using Flurl.Http.Testing;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Net;
using System.Text;
using Xunit;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.IdentityProvider.Models;
using Yoma.Core.Infrastructure.DidxMe.Client;
using Yoma.Core.Infrastructure.DidxMe.Interfaces;
using Yoma.Core.Infrastructure.DidxMe.Models;

namespace Yoma.Core.Test.SSI.DidxMe
{
  public class HolderTests
  {
    #region Class Variables
    private const string YomaEndpoint = "https://yoma.example.test/realms/yoma/protocol/openid-connect/token";
    private const string HolderEndpoint = "https://didx.example.test/iam/realms/consumers/protocol/openid-connect/token";
    private const string Audience = "https://didx.example.test/iam/realms/consumers";
    private const string WalletEndpoint = "https://wallet.example.test/api/v2/credentials";
    private const string CredentialId = "b0103833-2bb2-470d-bd7e-9a708411fca1";
    #endregion

    #region Tests
    [Fact]
    public async Task BackgroundTokensAreSeparateFromInteractiveTokensAndUseOnlyTheExplicitIdentityOperation()
    {
      using var http = new HttpTest().WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var issuedAt = DateTimeOffset.UtcNow;
      var cache = new HolderTokenCacheFixture();
      var userId = Guid.NewGuid();
      var identity = new Mock<IIdentityProviderClient>();
      var assertion = new UserAccessToken
      {
        AccessToken = Token(issuedAt, new JObject { ["sub"] = userId.ToString(), ["aud"] = Audience }),
        ExpiresIn = 120
      };
      identity.Setup(client => client.GetUserAccessToken(userId, It.IsAny<CancellationToken>())).ReturnsAsync(assertion);
      identity.Setup(client => client.ExchangeUserAccessToken(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(assertion);
      var factory = new Mock<IIdentityProviderClientFactory>();
      factory.Setup(value => value.CreateClient()).Returns(identity.Object);
      using var background = cache.Create(CreateOptions(), identityProvider: factory.Object);
      using var interactive = cache.Create(CreateOptions(), identityProvider: factory.Object);
      var context = new HolderContext { UserId = userId.ToString(), HolderId = "holder-a", IsBackground = true };
      http.RespondWithJson(new { access_token = Token(issuedAt, HolderClaims()), token_type = "Bearer", expires_in = 120 });
      await background.GetAuthHeader(context, TestContext.Current.CancellationToken);
      await background.GetAuthHeader(context, TestContext.Current.CancellationToken);
      using var anotherScope = cache.Create(CreateOptions(), identityProvider: factory.Object);
      await anotherScope.GetAuthHeader(context, TestContext.Current.CancellationToken);
      factory.Verify(value => value.CreateClient(), Times.Once);
      identity.Verify(client => client.GetUserAccessToken(userId, It.IsAny<CancellationToken>()), Times.Once);
      identity.Verify(client => client.ExchangeUserAccessToken(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);

      context = new HolderContext
      {
        UserId = userId.ToString(),
        HolderId = "holder-a",
        AccessToken = Token(issuedAt, new JObject { ["sub"] = userId.ToString() })
      };
      http.RespondWithJson(new { access_token = Token(issuedAt, HolderClaims()), token_type = "Bearer", expires_in = 120 });
      await interactive.GetAuthHeader(context, TestContext.Current.CancellationToken);
      identity.Verify(client => client.ExchangeUserAccessToken(context.AccessToken, It.IsAny<CancellationToken>()), Times.Once);
      Assert.Equal(2, cache.Values.Count);
      cache.Lock.Verify(service => service.TryRunWithLockAsync(It.IsAny<string>(), TimeSpan.FromSeconds(180),
        TimeSpan.FromSeconds(180), It.IsAny<Func<Task>>(), It.IsAny<CancellationToken>(), It.IsAny<string>()), Times.Exactly(2));
    }

    [Fact]
    public async Task IdentityClientSecretRotationDoesNotInvalidateAnAlreadyIssuedHolderToken()
    {
      using var http = new HttpTest().WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var issuedAt = DateTimeOffset.UtcNow;
      var cache = new HolderTokenCacheFixture();
      using var first = cache.Create(CreateOptions());
      EnqueueTokens(http, issuedAt);
      await first.GetAuthHeader(CreateContext(issuedAt), TestContext.Current.CancellationToken);
      using var rotated = cache.Create(CreateOptions(), identitySecret: "rotated-identity-secret");
      EnqueueTokens(http, issuedAt);
      await rotated.GetAuthHeader(CreateContext(issuedAt), TestContext.Current.CancellationToken);
      Assert.Single(cache.Values);
      http.ShouldHaveCalled(YomaEndpoint).Times(1);
    }

    [Fact]
    public async Task InteractiveExchangeFailureNeverRequestsPrivilegedAccess()
    {
      var issuedAt = DateTimeOffset.UtcNow;
      var identity = new Mock<IIdentityProviderClient>();
      identity.Setup(client => client.ExchangeUserAccessToken(It.IsAny<string>(), It.IsAny<CancellationToken>()))
        .ThrowsAsync(new UnauthorizedAccessException("Exchange denied"));
      var factory = new Mock<IIdentityProviderClientFactory>();
      factory.Setup(value => value.CreateClient()).Returns(identity.Object);
      var cache = new HolderTokenCacheFixture();
      using var service = cache.Create(CreateOptions(), identityProvider: factory.Object);
      await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.GetAuthHeader(CreateContext(issuedAt), TestContext.Current.CancellationToken));
      identity.Verify(client => client.GetUserAccessToken(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
      Assert.Empty(cache.Values);
    }

    [Fact]
    public async Task SeparateScopesShareOnlyEncryptedTokensWithoutExtendingExpiry()
    {
      using var http = new HttpTest().WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var issuedAt = DateTimeOffset.UtcNow;
      var cache = new HolderTokenCacheFixture();
      var context = CreateContext(issuedAt);
      using var first = cache.Create(CreateOptions());
      using var second = cache.Create(CreateOptions());
      EnqueueTokens(http, issuedAt);

      var header = await first.GetAuthHeader(context, TestContext.Current.CancellationToken);
      var entry = Assert.Single(cache.Values);
      Assert.DoesNotContain(context.AccessToken, entry.Key);
      Assert.DoesNotContain(context.AccessToken, entry.Value);
      Assert.DoesNotContain(header.Value[7..], entry.Value);
      Assert.DoesNotContain(context.HolderId, entry.Key);
      Assert.DoesNotContain("test-only", entry.Key);
      Assert.InRange(cache.Expirations[entry.Key].TotalSeconds, 98, 100);

      Assert.Equal(header, await second.GetAuthHeader(context, TestContext.Current.CancellationToken));
      Assert.Equal(entry.Value, cache.Values[entry.Key]);
      Assert.Equal(2, http.CallLog.Count);
      cache.Cache.Verify(service => service.SetAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan?>()), Times.Once);
    }

    [Fact]
    public async Task ConcurrentScopesAcquireOneTokenAndCacheLockTimeoutMakesNoRequests()
    {
      using var http = new HttpTest().WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var issuedAt = DateTimeOffset.UtcNow;
      var cache = new HolderTokenCacheFixture();
      using var first = cache.Create(CreateOptions());
      using var second = cache.Create(CreateOptions());
      EnqueueTokens(http, issuedAt);
      var headers = await Task.WhenAll(
        first.GetAuthHeader(CreateContext(issuedAt), TestContext.Current.CancellationToken),
        second.GetAuthHeader(CreateContext(issuedAt), TestContext.Current.CancellationToken));
      Assert.Equal(headers[0], headers[1]);
      Assert.Equal(2, http.CallLog.Count);

      cache.Lock.Setup(service => service.TryRunWithLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(),
        It.IsAny<TimeSpan>(), It.IsAny<Func<Task>>(), It.IsAny<CancellationToken>(), It.IsAny<string>())).ReturnsAsync(false);
      using var blocked = cache.Create(CreateOptions());
      await Assert.ThrowsAsync<TimeoutException>(() => blocked.GetAuthHeader(CreateContext(issuedAt, jti: "new-session"), TestContext.Current.CancellationToken));
      Assert.Equal(2, http.CallLog.Count);
    }

    [Theory]
    [InlineData(20, 120, 120, 120, 120, 20)]
    [InlineData(600, 120, 60, 120, 120, 45)]
    [InlineData(600, 120, 120, 60, 120, 48)]
    public async Task DistributedExpiryUsesTheEarliestSourceAssertionAndHolderDeadline(
      int sourceLifetime, int assertionLifetime, int assertionExpiresIn, int holderLifetime, int holderExpiresIn, int expected)
    {
      using var http = new HttpTest().WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var issuedAt = DateTimeOffset.UtcNow;
      var cache = new HolderTokenCacheFixture();
      using var service = cache.Create(CreateOptions());
      var context = new HolderContext
      {
        AccessToken = Token(issuedAt, new JObject { ["sub"] = "user-a" }, sourceLifetime),
        UserId = "user-a",
        HolderId = "holder-a"
      };
      http.RespondWithJson(new
      {
        access_token = Token(issuedAt, new JObject { ["sub"] = "user-a", ["aud"] = Audience }, assertionLifetime),
        token_type = "Bearer",
        expires_in = assertionExpiresIn
      });
      http.RespondWithJson(new { access_token = Token(issuedAt, HolderClaims(), holderLifetime), token_type = "Bearer", expires_in = holderExpiresIn });

      await service.GetAuthHeader(context, TestContext.Current.CancellationToken);
      Assert.InRange(Assert.Single(cache.Expirations).Value.TotalSeconds, expected - 1, expected);
    }

    [Fact]
    public async Task ExpiredOrUnreadableSharedEntriesAreReplacedWithoutReusingTokens()
    {
      using var http = new HttpTest().WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var issuedAt = DateTimeOffset.UtcNow;
      var cache = new HolderTokenCacheFixture();
      var context = CreateContext(issuedAt);
      using var first = cache.Create(CreateOptions());
      EnqueueTokens(http, issuedAt);
      var original = await first.GetAuthHeader(context, TestContext.Current.CancellationToken);
      var expiredKey = Assert.Single(cache.Values).Key;
      var cached = JObject.Parse(cache.Encryption.Decrypt(cache.Values[expiredKey], expiredKey));
      cached["DateExpire"] = DateTimeOffset.UtcNow.AddSeconds(-1);
      cache.Values[expiredKey] = cache.Encryption.Encrypt(cached.ToString(), expiredKey);
      using var expired = cache.Create(CreateOptions());
      var replacementClaims = HolderClaims();
      replacementClaims["jti"] = "replacement-after-expiry";
      EnqueueTokens(http, issuedAt, holderClaims: replacementClaims);
      Assert.NotEqual(original, await expired.GetAuthHeader(context, TestContext.Current.CancellationToken));

      var key = Assert.Single(cache.Values).Key;
      cache.Values[key] = "corrupted ciphertext";
      using var corrupted = cache.Create(CreateOptions());
      EnqueueTokens(http, issuedAt);
      await corrupted.GetAuthHeader(context, TestContext.Current.CancellationToken);
      Assert.NotEqual("corrupted ciphertext", cache.Values[key]);
      Assert.Equal(6, http.CallLog.Count);
    }

    [Fact]
    public async Task OldUnauthorizedResponseDoesNotEvictAnotherScopesReplacement()
    {
      using var http = new HttpTest().WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var issuedAt = DateTimeOffset.UtcNow;
      var cache = new HolderTokenCacheFixture();
      var context = CreateContext(issuedAt);
      using var first = cache.Create(CreateOptions());
      using var second = cache.Create(CreateOptions());
      EnqueueTokens(http, issuedAt);
      await first.GetAuthHeader(context, TestContext.Current.CancellationToken);
      await second.GetAuthHeader(context, TestContext.Current.CancellationToken);
      await second.Invalidate();
      Assert.Empty(cache.Values);

      var replacementClaims = HolderClaims();
      replacementClaims["jti"] = "replacement";
      EnqueueTokens(http, issuedAt, holderClaims: replacementClaims);
      using var replacement = cache.Create(CreateOptions());
      var header = await replacement.GetAuthHeader(context, TestContext.Current.CancellationToken);
      await first.Invalidate();
      Assert.Single(cache.Values);

      using var next = cache.Create(CreateOptions());
      Assert.Equal(header, await next.GetAuthHeader(context, TestContext.Current.CancellationToken));
      Assert.Equal(4, http.CallLog.Count);
    }

    [Fact]
    public async Task SharedTokensAreIsolatedBySourceHolderAndClientConfiguration()
    {
      using var http = new HttpTest().WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var issuedAt = DateTimeOffset.UtcNow;
      var cache = new HolderTokenCacheFixture();
      using var first = cache.Create(CreateOptions());
      EnqueueTokens(http, issuedAt);
      await first.GetAuthHeader(CreateContext(issuedAt), TestContext.Current.CancellationToken);

      using var refreshed = cache.Create(CreateOptions());
      EnqueueTokens(http, issuedAt);
      await refreshed.GetAuthHeader(CreateContext(issuedAt, jti: "refreshed"), TestContext.Current.CancellationToken);
      using var holder = cache.Create(CreateOptions());
      EnqueueTokens(http, issuedAt, "holder-b");
      await holder.GetAuthHeader(CreateContext(issuedAt, "holder-b"), TestContext.Current.CancellationToken);

      var options = CreateOptions();
      options.Holder.ClientSecret = "rotated-test-only";
      using var rotated = cache.Create(options);
      EnqueueTokens(http, issuedAt);
      await rotated.GetAuthHeader(CreateContext(issuedAt), TestContext.Current.CancellationToken);
      Assert.Equal(4, cache.Values.Count);
      Assert.Equal(8, http.CallLog.Count);
    }

    [Fact]
    public async Task ExchangesBothTokensAndCachesOnlyForTheSameInputAndHolder()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var issuedAt = DateTimeOffset.UtcNow;
      using var service = new HolderTokenCacheFixture().Create(CreateOptions());
      var context = CreateContext(issuedAt);
      EnqueueTokens(http, issuedAt);

      var first = await service.GetAuthHeader(context, TestContext.Current.CancellationToken);
      Assert.Equal(first, await service.GetAuthHeader(context, TestContext.Current.CancellationToken));
      Assert.Equal("Authorization", first.Key);
      http.ShouldHaveCalled(YomaEndpoint).WithVerb(HttpMethod.Post)
        .WithRequestBody("*grant_type=*token-exchange*subject_token=*").Times(1);
      http.ShouldHaveCalled(HolderEndpoint).WithVerb(HttpMethod.Post)
        .WithRequestBody("*grant_type=*jwt-bearer*assertion=*").Times(1);

      EnqueueTokens(http, issuedAt, "holder-b");
      var otherHolder = new HolderContext { AccessToken = context.AccessToken, UserId = "user-a", HolderId = "holder-b" };
      Assert.NotEqual(first, await service.GetAuthHeader(otherHolder, TestContext.Current.CancellationToken));
      http.ShouldHaveCalled(HolderEndpoint).Times(2);

      EnqueueTokens(http, issuedAt, "holder-b");
      var refreshedInput = CreateContext(issuedAt, "holder-b", "new-login-token");
      await service.GetAuthHeader(refreshedInput, TestContext.Current.CancellationToken);
      http.ShouldHaveCalled(HolderEndpoint).Times(3);
    }

    [Theory]
    [InlineData(30)]
    [InlineData(0)]
    public async Task RefreshAndInvalidationAcquireNewAssertions(int bufferSeconds)
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var clock = new TestTimeProvider();
      var issuedAt = clock.GetUtcNow();
      var options = CreateOptions();
      options.AccessTokenRefreshBufferSeconds = bufferSeconds;
      options.RequestTimeoutSeconds = 17;
      var cache = new HolderTokenCacheFixture();
      using var service = cache.Create(options, timeProvider: clock);
      var context = CreateContext(issuedAt);
      EnqueueTokens(http, issuedAt, holderExpiresIn: 100);
      var first = await service.GetAuthHeader(context, TestContext.Current.CancellationToken);
      Assert.InRange(Assert.Single(cache.Expirations).Value.TotalSeconds, 90, 100);
      http.ShouldHaveCalled(HolderEndpoint).Times(1);
      Assert.All(http.CallLog, call => Assert.Equal(TimeSpan.FromSeconds(
        call.Request.Url.ToString() == YomaEndpoint ? 30 : 17), call.Request.Settings.Timeout));
      Assert.Equal(first, await service.GetAuthHeader(context, TestContext.Current.CancellationToken));
      http.ShouldHaveCalled(HolderEndpoint).Times(1);
      clock.Advance(TimeSpan.FromSeconds(bufferSeconds == 0 ? 100 : 90));
      EnqueueTokens(http, issuedAt);
      await service.GetAuthHeader(context, TestContext.Current.CancellationToken);
      await service.Invalidate();
      EnqueueTokens(http, issuedAt);
      await service.GetAuthHeader(context, TestContext.Current.CancellationToken);
      http.ShouldHaveCalled(YomaEndpoint).Times(3);
      http.ShouldHaveCalled(HolderEndpoint).Times(3);
    }

    [Theory]
    [InlineData("sub", "another-holder")]
    [InlineData("tenantAlias", "another-tenant")]
    [InlineData("iss", "another-issuer")]
    [InlineData("aud", "another-api")]
    public async Task WrongHolderContextIsRejectedAndNotCached(string claim, string value)
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var issuedAt = DateTimeOffset.UtcNow;
      using var service = new HolderTokenCacheFixture().Create(CreateOptions());
      var badClaims = HolderClaims();
      badClaims[claim] = value;
      EnqueueTokens(http, issuedAt, holderClaims: badClaims);
      await Assert.ThrowsAsync<InvalidOperationException>(() => service.GetAuthHeader(CreateContext(issuedAt), TestContext.Current.CancellationToken));
      EnqueueTokens(http, issuedAt);
      await service.GetAuthHeader(CreateContext(issuedAt), TestContext.Current.CancellationToken);
      http.ShouldHaveCalled(YomaEndpoint).Times(2);
    }

    [Fact]
    public async Task MultiAudienceAssertionNeverReachesDidxGrant()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var issuedAt = DateTimeOffset.UtcNow;
      http.RespondWithJson(new
      {
        access_token = Token(issuedAt, new JObject { ["sub"] = "user-a", ["aud"] = new JArray(Audience, "extra") }),
        token_type = "Bearer",
        expires_in = 120
      });
      using var service = new HolderTokenCacheFixture().Create(CreateOptions());
      await Assert.ThrowsAsync<InvalidOperationException>(() => service.GetAuthHeader(CreateContext(issuedAt), TestContext.Current.CancellationToken));
      http.ShouldNotHaveCalled(HolderEndpoint);
    }

    [Fact]
    public async Task ExpiredOrMismatchedYomaContextMakesNoRequests()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var issuedAt = DateTimeOffset.UtcNow;
      using var service = new HolderTokenCacheFixture().Create(CreateOptions());
      var mismatched = new HolderContext { AccessToken = CreateContext(issuedAt).AccessToken, UserId = "other-user", HolderId = "holder-a" };
      await Assert.ThrowsAsync<InvalidOperationException>(() => service.GetAuthHeader(mismatched, TestContext.Current.CancellationToken));
      var expired = CreateContext(issuedAt.AddMinutes(-11));
      await Assert.ThrowsAsync<InvalidOperationException>(() => service.GetAuthHeader(expired, TestContext.Current.CancellationToken));
      http.ShouldNotHaveMadeACall();
    }

    [Fact]
    public async Task CancellationMakesNoRequests()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var issuedAt = DateTimeOffset.UtcNow;
      using var service = new HolderTokenCacheFixture().Create(CreateOptions());
      using var cancellation = new CancellationTokenSource();
      cancellation.Cancel();
      await Assert.ThrowsAsync<OperationCanceledException>(() => service.GetAuthHeader(CreateContext(issuedAt), cancellation.Token));
      http.ShouldNotHaveMadeACall();
    }

    [Fact]
    public async Task WalletPagePreservesClaimsAndPaginationWithoutFollowingProviderLinks()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      http.RespondWithJson(new { data = new[] { Credential() }, links = new { next = "https://untrusted.example.test/page2" } });
      var auth = CreateAuth();
      var client = new WalletClient(Options.Create(CreateOptions()), auth.Object);
      var page = await client.ListCredentialPage(CreateContext(DateTimeOffset.UtcNow), "cursor-a", 20, cancellationToken: TestContext.Current.CancellationToken);
      Assert.Single(page.Data!);
      Assert.True(page.Data![0].Claims.Value<bool>("verified"));
      Assert.Equal(7, page.Data[0].Claims.Value<int>("score"));
      Assert.Equal("https://untrusted.example.test/page2", page.Links!["next"]);
      http.ShouldHaveCalled(WalletEndpoint).WithQueryParam("status", "accepted")
        .WithQueryParam("page[size]", 20).WithQueryParam("page[after]", "cursor-a")
        .WithHeader("Authorization", "Bearer holder-token").Times(1);
      http.ShouldNotHaveCalled("https://untrusted.example.test/*");
    }

    [Theory]
    [InlineData(401)]
    [InlineData(403)]
    public async Task WalletFailuresPropagateInsteadOfReturningAbsence(int status)
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      http.RespondWithJson(new { error = "failure" }, status);
      var auth = CreateAuth();
      var client = new WalletClient(Options.Create(CreateOptions()), auth.Object);
      var exception = await Assert.ThrowsAsync<HttpClientException>(() => client.GetCredential(CreateContext(DateTimeOffset.UtcNow), CredentialId, TestContext.Current.CancellationToken));
      Assert.Equal((HttpStatusCode)status, exception.StatusCode);
      auth.Verify(service => service.Invalidate(), status == 401 ? Times.Once() : Times.Never());
      http.ShouldHaveCalled(WalletEndpoint + "/" + CredentialId).Times(1);
    }

    [Fact]
    public async Task WalletListFailureUsesSharedHttpErrorAndDoesNotReturnAnEmptyPage()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      http.RespondWith("Unavailable", 503);
      var client = new WalletClient(Options.Create(CreateOptions()), CreateAuth().Object);

      var exception = await Assert.ThrowsAsync<HttpClientException>(() =>
        client.ListCredentialPage(CreateContext(DateTimeOffset.UtcNow), cancellationToken: TestContext.Current.CancellationToken));

      Assert.Equal(HttpStatusCode.ServiceUnavailable, exception.StatusCode);
      Assert.Single(http.CallLog);
    }

    [Fact]
    public async Task AssertionExchangeFailureUsesSharedHttpErrorWithoutCallingHolderGrant()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      http.ForCallsTo(YomaEndpoint).RespondWith("Invalid assertion client", 401);
      var issuedAt = DateTimeOffset.UtcNow;
      using var service = new HolderTokenCacheFixture().Create(CreateOptions());

      var exception = await Assert.ThrowsAsync<HttpClientException>(() =>
        service.GetAuthHeader(CreateContext(issuedAt), TestContext.Current.CancellationToken));

      Assert.Equal(HttpStatusCode.Unauthorized, exception.StatusCode);
      http.ShouldHaveCalled(YomaEndpoint).Times(1);
      http.ShouldNotHaveCalled(HolderEndpoint);
    }

    [Theory]
    [InlineData(false, HttpStatusCode.BadRequest)]
    [InlineData(true, HttpStatusCode.BadRequest)]
    [InlineData(false, HttpStatusCode.Unauthorized)]
    [InlineData(true, HttpStatusCode.Unauthorized)]
    [InlineData(false, HttpStatusCode.InternalServerError)]
    [InlineData(true, HttpStatusCode.InternalServerError)]
    public async Task TokenExchangeLogsOnlyBadRequestsWithoutSensitiveContentAndPreservesFailure(bool holderGrant, HttpStatusCode status)
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var issuedAt = DateTimeOffset.UtcNow;
      var cache = new HolderTokenCacheFixture();
      using var service = cache.Create(CreateOptions());
      var context = CreateContext(issuedAt);
      if (holderGrant)
        http.RespondWithJson(new
        {
          access_token = Token(issuedAt, new JObject { ["sub"] = "user-a", ["aud"] = Audience }),
          token_type = "Bearer",
          expires_in = 120
        });

      const string response = "{\"error\":\"invalid_grant\",\"error_description\":\"private-provider-diagnostic\"}";
      http.RespondWith(response, (int)status);

      var exception = await Assert.ThrowsAsync<HttpClientException>(() =>
        service.GetAuthHeader(context, TestContext.Current.CancellationToken));

      Assert.Equal(status, exception.StatusCode);
      Assert.Equal(response, exception.Message);
      Assert.Empty(cache.Values);
      Assert.Equal(holderGrant ? 2 : 1, http.CallLog.Count);
      var logs = cache.Logger.Invocations.Where(invocation => invocation.Method.Name == "Log").ToList();
      if (status == HttpStatusCode.BadRequest)
      {
        var log = Assert.Single(logs);
        Assert.Equal(LogLevel.Error, log.Arguments[0]);
        Assert.Equal("Holder token exchange failed with HTTP 400. Check identity-provider logs for the rejection reason.", log.Arguments[2]?.ToString());
        Assert.Null(log.Arguments[3]);
      }
      else
        Assert.Empty(logs);
    }

    [Fact]
    public async Task WalletRejectsMissingDataInsteadOfReturningAnEmptyPage()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      http.RespondWithJson(new { meta = new { totalCount = 0 } });
      var client = new WalletClient(Options.Create(CreateOptions()), CreateAuth().Object);
      await Assert.ThrowsAsync<InvalidOperationException>(() => client.ListCredentialPage(CreateContext(DateTimeOffset.UtcNow), cancellationToken: TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task FailedHolderGrantIsNotCachedAndRetryUsesANewAssertion()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var issuedAt = DateTimeOffset.UtcNow;
      http.RespondWithJson(new
      {
        access_token = Token(issuedAt, new JObject { ["sub"] = "user-a", ["aud"] = Audience }),
        token_type = "Bearer",
        expires_in = 120
      });
      http.RespondWithJson(new { error = "invalid_grant" }, 400);
      using var service = new HolderTokenCacheFixture().Create(CreateOptions());
      var exception = await Assert.ThrowsAsync<HttpClientException>(() => service.GetAuthHeader(CreateContext(issuedAt), TestContext.Current.CancellationToken));
      Assert.Equal(HttpStatusCode.BadRequest, exception.StatusCode);

      EnqueueTokens(http, issuedAt);
      await service.GetAuthHeader(CreateContext(issuedAt), TestContext.Current.CancellationToken);
      http.ShouldHaveCalled(YomaEndpoint).Times(2);
      http.ShouldHaveCalled(HolderEndpoint).Times(2);
    }

    [Fact]
    public async Task WalletParsingPreservesSignedStringsWithTheHostSerializer()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var claims = new Dictionary<string, object>
      {
        ["Issued"] = "2026-11-02T10:35:38.173Z",
        ["DisplayName"] = "  Participant  ",
        ["Skills"] = "[\"Skill A\",\"Skill B\"]",
        ["Verified"] = true,
        ["Score"] = 7
      };
      var credential = new
      {
        id = CredentialId,
        format = "vc+sd-jwt",
        vct = "YomaYoId-v1",
        status = "accepted",
        iat = "2026-11-02T00:00:00Z",
        claims
      };
      http.ForCallsTo(WalletEndpoint + "/" + CredentialId)
        .RespondWith(JsonConvert.SerializeObject(new { data = credential }));
      http.ForCallsTo(WalletEndpoint + "?*")
        .RespondWith(JsonConvert.SerializeObject(new { data = new[] { credential } }));
      var client = new WalletClient(Options.Create(CreateOptions()), CreateAuth().Object);
      var context = CreateContext(DateTimeOffset.UtcNow);

      var single = await client.GetCredential(context, CredentialId, TestContext.Current.CancellationToken);
      var page = await client.ListCredentialPage(context, cancellationToken: TestContext.Current.CancellationToken);

      foreach (var result in new[] { single, Assert.Single(page.Data!) })
      {
        Assert.Equal(JTokenType.String, result.Claims["Issued"]!.Type);
        Assert.Equal(claims["Issued"], result.Claims.Value<string>("Issued"));
        Assert.Equal(claims["DisplayName"], result.Claims.Value<string>("DisplayName"));
        Assert.Equal(claims["Skills"], result.Claims.Value<string>("Skills"));
        Assert.Equal(JTokenType.Boolean, result.Claims["Verified"]!.Type);
        Assert.Equal(JTokenType.Integer, result.Claims["Score"]!.Type);
      }
    }

    [Fact]
    public async Task WalletGetReturnsTheRequestedCredential()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      http.RespondWithJson(new { data = Credential() });
      var client = new WalletClient(Options.Create(CreateOptions()), CreateAuth().Object);
      var credential = await client.GetCredential(CreateContext(DateTimeOffset.UtcNow), CredentialId, TestContext.Current.CancellationToken);
      Assert.Equal(CredentialId, credential.Id);
      Assert.Equal("YomaYoId-v1", credential.Vct);
      Assert.Equal(new DateTimeOffset(2026, 11, 2, 0, 0, 0, TimeSpan.Zero), credential.DateIssued);
    }

    [Theory]
    [InlineData("id", "c0103833-2bb2-470d-bd7e-9a708411fca1")]
    [InlineData("format", "mso_mdoc")]
    public async Task WalletGetRejectsDifferentIdentityOrUnsupportedFormat(string field, string value)
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var data = JObject.FromObject(Credential());
      data[field] = value;
      http.RespondWith(new JObject { ["data"] = data }.ToString());
      var client = new WalletClient(Options.Create(CreateOptions()), CreateAuth().Object);
      if (field == "format")
        await Assert.ThrowsAsync<NotSupportedException>(() => client.GetCredential(CreateContext(DateTimeOffset.UtcNow), CredentialId, TestContext.Current.CancellationToken));
      else
        await Assert.ThrowsAsync<InvalidOperationException>(() => client.GetCredential(CreateContext(DateTimeOffset.UtcNow), CredentialId, TestContext.Current.CancellationToken));
    }

    #endregion

    #region Private Members
    private static ProviderOptions CreateOptions() => new()
    {
      TenantAlias = "yoma",
      KeycloakBaseUri = "https://didx.example.test/iam",
      WalletBaseUri = "https://wallet.example.test/api",
      Holder = new()
      {
        Realm = "consumers",
        ClientId = "holder-client",
        ClientSecret = "test-only",
        AssertionAudience = Audience
      }
    };

    private static HolderContext CreateContext(DateTimeOffset issuedAt, string holderId = "holder-a", string jti = "input-a") => new()
    {
      AccessToken = Token(issuedAt, new JObject { ["sub"] = "user-a", ["jti"] = jti }, 600),
      UserId = "user-a",
      HolderId = holderId
    };

    private static JObject HolderClaims(string holderId = "holder-a") => new()
    {
      ["sub"] = holderId,
      ["tenantAlias"] = "yoma",
      ["iss"] = Audience,
      ["aud"] = "me-wallet-api"
    };

    private static void EnqueueTokens(HttpTest http, DateTimeOffset issuedAt, string holderId = "holder-a", JObject? holderClaims = null, int holderExpiresIn = 120)
    {
      http.RespondWithJson(new { access_token = Token(issuedAt, new JObject { ["sub"] = "user-a", ["aud"] = Audience }), token_type = "Bearer", expires_in = 120 });
      http.RespondWithJson(new { access_token = Token(issuedAt, holderClaims ?? HolderClaims(holderId)), token_type = "Bearer", expires_in = holderExpiresIn });
    }

    private static string Token(DateTimeOffset issuedAt, JObject claims, int lifetime = 120)
    {
      claims["exp"] = issuedAt.AddSeconds(lifetime).ToUnixTimeSeconds();
      // Synthetic HTTP fixtures only; the service expects the host to authenticate Yoma tokens.
      return "e30." + Convert.ToBase64String(Encoding.UTF8.GetBytes(claims.ToString()))
        .TrimEnd('=').Replace('+', '-').Replace('/', '_') + ".test-signature";
    }

    private static object Credential() => new
    {
      id = CredentialId,
      format = "vc+sd-jwt",
      vct = "YomaYoId-v1",
      status = "accepted",
      iat = "2026-11-02T00:00:00Z",
      claims = new { verified = true, score = 7 }
    };

    private static Mock<IHolderAuthService> CreateAuth()
    {
      var auth = new Mock<IHolderAuthService>();
      auth.Setup(service => service.GetAuthHeader(It.IsAny<HolderContext>(), It.IsAny<CancellationToken>()))
        .ReturnsAsync(new KeyValuePair<string, string>("Authorization", "Bearer holder-token"));
      return auth;
    }

    #endregion
  }
}
