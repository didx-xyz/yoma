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
using Yoma.Core.Domain.SSI;
using Yoma.Core.Infrastructure.DidxMe.Client;
using Yoma.Core.Infrastructure.DidxMe.Interfaces;
using Yoma.Core.Infrastructure.DidxMe.Models;
using Yoma.Core.Infrastructure.DidxMe.Services;

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
    public async Task SeparateScopesShareOnlyEncryptedTokensWithoutExtendingExpiry()
    {
      using var http = new HttpTest().WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var clock = new TestClock();
      var cache = new HolderTokenCacheFixture();
      var context = CreateContext(clock);
      using var first = cache.Create(clock, CreateOptions());
      using var second = cache.Create(clock, CreateOptions());
      EnqueueTokens(http, clock);

      var header = await first.GetAuthHeader(context, TestContext.Current.CancellationToken);
      var entry = Assert.Single(cache.Values);
      Assert.DoesNotContain(context.AccessToken, entry.Key);
      Assert.DoesNotContain(context.AccessToken, entry.Value);
      Assert.DoesNotContain(header.Value[7..], entry.Value);
      Assert.DoesNotContain(context.HolderId, entry.Key);
      Assert.DoesNotContain("test-only", entry.Key);
      Assert.Equal(TimeSpan.FromSeconds(108), cache.Expirations[entry.Key]);

      clock.Now = clock.Now.AddSeconds(30);
      Assert.Equal(header, await second.GetAuthHeader(context, TestContext.Current.CancellationToken));
      Assert.Equal(entry.Value, cache.Values[entry.Key]);
      Assert.Equal(2, http.CallLog.Count);
      cache.Cache.Verify(service => service.SetAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan?>()), Times.Once);
    }

    [Fact]
    public async Task ConcurrentScopesAcquireOneTokenAndCacheLockTimeoutMakesNoRequests()
    {
      using var http = new HttpTest().WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var clock = new TestClock();
      var cache = new HolderTokenCacheFixture();
      using var first = cache.Create(clock, CreateOptions());
      using var second = cache.Create(clock, CreateOptions());
      EnqueueTokens(http, clock);
      var headers = await Task.WhenAll(
        first.GetAuthHeader(CreateContext(clock), TestContext.Current.CancellationToken),
        second.GetAuthHeader(CreateContext(clock), TestContext.Current.CancellationToken));
      Assert.Equal(headers[0], headers[1]);
      Assert.Equal(2, http.CallLog.Count);

      cache.Lock.Setup(service => service.TryRunWithLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(),
        It.IsAny<TimeSpan>(), It.IsAny<Func<Task>>(), It.IsAny<CancellationToken>(), It.IsAny<string>())).ReturnsAsync(false);
      using var blocked = cache.Create(clock, CreateOptions());
      await Assert.ThrowsAsync<TimeoutException>(() => blocked.GetAuthHeader(CreateContext(clock, jti: "new-session"), TestContext.Current.CancellationToken));
      Assert.Equal(2, http.CallLog.Count);
    }

    [Theory]
    [InlineData(20, 120, 120, 120, 120, 20)]
    [InlineData(600, 120, 60, 120, 120, 54)]
    [InlineData(600, 120, 120, 60, 120, 48)]
    public async Task DistributedExpiryUsesTheEarliestSourceAssertionAndHolderDeadline(
      int sourceLifetime, int assertionLifetime, int assertionExpiresIn, int holderLifetime, int holderExpiresIn, int expected)
    {
      using var http = new HttpTest().WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var clock = new TestClock();
      var cache = new HolderTokenCacheFixture();
      using var service = cache.Create(clock, CreateOptions());
      var context = new HolderContext
      {
        AccessToken = Token(clock, new JObject { ["sub"] = "user-a" }, sourceLifetime),
        UserId = "user-a",
        HolderId = "holder-a"
      };
      http.RespondWithJson(new
      {
        access_token = Token(clock, new JObject { ["sub"] = "user-a", ["aud"] = Audience }, assertionLifetime),
        token_type = "Bearer",
        expires_in = assertionExpiresIn
      });
      http.RespondWithJson(new { access_token = Token(clock, HolderClaims(), holderLifetime), token_type = "Bearer", expires_in = holderExpiresIn });

      await service.GetAuthHeader(context, TestContext.Current.CancellationToken);
      Assert.Equal(TimeSpan.FromSeconds(expected), Assert.Single(cache.Expirations).Value);
    }

    [Fact]
    public async Task ExpiredOrUnreadableSharedEntriesAreReplacedWithoutReusingTokens()
    {
      using var http = new HttpTest().WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var clock = new TestClock();
      var cache = new HolderTokenCacheFixture();
      var context = CreateContext(clock);
      using var first = cache.Create(clock, CreateOptions());
      EnqueueTokens(http, clock);
      var original = await first.GetAuthHeader(context, TestContext.Current.CancellationToken);
      clock.Now = clock.Now.AddSeconds(108);
      using var expired = cache.Create(clock, CreateOptions());
      EnqueueTokens(http, clock);
      Assert.NotEqual(original, await expired.GetAuthHeader(context, TestContext.Current.CancellationToken));

      var key = Assert.Single(cache.Values).Key;
      cache.Values[key] = "corrupted ciphertext";
      using var corrupted = cache.Create(clock, CreateOptions());
      EnqueueTokens(http, clock);
      await corrupted.GetAuthHeader(context, TestContext.Current.CancellationToken);
      Assert.NotEqual("corrupted ciphertext", cache.Values[key]);
      Assert.Equal(6, http.CallLog.Count);
    }

    [Fact]
    public async Task OldUnauthorizedResponseDoesNotEvictAnotherScopesReplacement()
    {
      using var http = new HttpTest().WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var clock = new TestClock();
      var cache = new HolderTokenCacheFixture();
      var context = CreateContext(clock);
      using var first = cache.Create(clock, CreateOptions());
      using var second = cache.Create(clock, CreateOptions());
      EnqueueTokens(http, clock);
      await first.GetAuthHeader(context, TestContext.Current.CancellationToken);
      await second.GetAuthHeader(context, TestContext.Current.CancellationToken);
      await second.Invalidate();
      Assert.Empty(cache.Values);

      var replacementClaims = HolderClaims();
      replacementClaims["jti"] = "replacement";
      EnqueueTokens(http, clock, holderClaims: replacementClaims);
      using var replacement = cache.Create(clock, CreateOptions());
      var header = await replacement.GetAuthHeader(context, TestContext.Current.CancellationToken);
      await first.Invalidate();
      Assert.Single(cache.Values);

      using var next = cache.Create(clock, CreateOptions());
      Assert.Equal(header, await next.GetAuthHeader(context, TestContext.Current.CancellationToken));
      Assert.Equal(4, http.CallLog.Count);
    }

    [Fact]
    public async Task SharedTokensAreIsolatedBySourceHolderAndClientConfiguration()
    {
      using var http = new HttpTest().WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var clock = new TestClock();
      var cache = new HolderTokenCacheFixture();
      using var first = cache.Create(clock, CreateOptions());
      EnqueueTokens(http, clock);
      await first.GetAuthHeader(CreateContext(clock), TestContext.Current.CancellationToken);

      using var refreshed = cache.Create(clock, CreateOptions());
      EnqueueTokens(http, clock);
      await refreshed.GetAuthHeader(CreateContext(clock, jti: "refreshed"), TestContext.Current.CancellationToken);
      using var holder = cache.Create(clock, CreateOptions());
      EnqueueTokens(http, clock, "holder-b");
      await holder.GetAuthHeader(CreateContext(clock, "holder-b"), TestContext.Current.CancellationToken);

      var options = CreateOptions();
      options.Holder.ClientSecret = "rotated-test-only";
      using var rotated = cache.Create(clock, options);
      EnqueueTokens(http, clock);
      await rotated.GetAuthHeader(CreateContext(clock), TestContext.Current.CancellationToken);
      Assert.Equal(4, cache.Values.Count);
      Assert.Equal(8, http.CallLog.Count);
    }

    [Fact]
    public async Task ExchangesBothTokensAndCachesOnlyForTheSameInputAndHolder()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var clock = new TestClock();
      using var service = new HolderTokenCacheFixture().Create(clock, CreateOptions());
      var context = CreateContext(clock);
      EnqueueTokens(http, clock);

      var first = await service.GetAuthHeader(context, TestContext.Current.CancellationToken);
      Assert.Equal(first, await service.GetAuthHeader(context, TestContext.Current.CancellationToken));
      Assert.Equal("Authorization", first.Key);
      http.ShouldHaveCalled(YomaEndpoint).WithVerb(HttpMethod.Post)
        .WithRequestBody("*grant_type=*token-exchange*subject_token=*").Times(1);
      http.ShouldHaveCalled(HolderEndpoint).WithVerb(HttpMethod.Post)
        .WithRequestBody("*grant_type=*jwt-bearer*assertion=*").Times(1);

      EnqueueTokens(http, clock, "holder-b");
      var otherHolder = new HolderContext { AccessToken = context.AccessToken, UserId = "user-a", HolderId = "holder-b" };
      Assert.NotEqual(first, await service.GetAuthHeader(otherHolder, TestContext.Current.CancellationToken));
      http.ShouldHaveCalled(HolderEndpoint).Times(2);

      EnqueueTokens(http, clock, "holder-b");
      var refreshedInput = CreateContext(clock, "holder-b", "new-login-token");
      await service.GetAuthHeader(refreshedInput, TestContext.Current.CancellationToken);
      http.ShouldHaveCalled(HolderEndpoint).Times(3);
    }

    [Theory]
    [InlineData(30, 108)]
    [InlineData(5, 115)]
    [InlineData(0, 120)]
    public async Task RefreshAndInvalidationAcquireNewAssertions(int bufferSeconds, int refreshAfterSeconds)
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var clock = new TestClock();
      var options = CreateOptions();
      options.AccessTokenRefreshBufferSeconds = bufferSeconds;
      options.RequestTimeoutSeconds = 17;
      using var service = new HolderTokenCacheFixture().Create(clock, options);
      var context = CreateContext(clock);
      EnqueueTokens(http, clock);
      await service.GetAuthHeader(context, TestContext.Current.CancellationToken);
      clock.Now = clock.Now.AddSeconds(refreshAfterSeconds - 1);
      await service.GetAuthHeader(context, TestContext.Current.CancellationToken);
      http.ShouldHaveCalled(HolderEndpoint).Times(1);
      Assert.All(http.CallLog, call => Assert.Equal(TimeSpan.FromSeconds(17), call.Request.Settings.Timeout));
      clock.Now = clock.Now.AddSeconds(1);
      EnqueueTokens(http, clock);
      await service.GetAuthHeader(context, TestContext.Current.CancellationToken);
      await service.Invalidate();
      EnqueueTokens(http, clock);
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
      var clock = new TestClock();
      using var service = new HolderTokenCacheFixture().Create(clock, CreateOptions());
      var badClaims = HolderClaims();
      badClaims[claim] = value;
      EnqueueTokens(http, clock, holderClaims: badClaims);
      await Assert.ThrowsAsync<InvalidOperationException>(() => service.GetAuthHeader(CreateContext(clock), TestContext.Current.CancellationToken));
      EnqueueTokens(http, clock);
      await service.GetAuthHeader(CreateContext(clock), TestContext.Current.CancellationToken);
      http.ShouldHaveCalled(YomaEndpoint).Times(2);
    }

    [Fact]
    public async Task MultiAudienceAssertionNeverReachesDidxGrant()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var clock = new TestClock();
      http.RespondWithJson(new
      {
        access_token = Token(clock, new JObject { ["sub"] = "user-a", ["aud"] = new JArray(Audience, "extra") }),
        token_type = "Bearer",
        expires_in = 120
      });
      using var service = new HolderTokenCacheFixture().Create(clock, CreateOptions());
      await Assert.ThrowsAsync<InvalidOperationException>(() => service.GetAuthHeader(CreateContext(clock), TestContext.Current.CancellationToken));
      http.ShouldNotHaveCalled(HolderEndpoint);
    }

    [Fact]
    public async Task ExpiredOrMismatchedYomaContextMakesNoRequests()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var clock = new TestClock();
      using var service = new HolderTokenCacheFixture().Create(clock, CreateOptions());
      var mismatched = new HolderContext { AccessToken = CreateContext(clock).AccessToken, UserId = "other-user", HolderId = "holder-a" };
      await Assert.ThrowsAsync<InvalidOperationException>(() => service.GetAuthHeader(mismatched, TestContext.Current.CancellationToken));
      var expired = CreateContext(clock);
      clock.Now = clock.Now.AddMinutes(11);
      await Assert.ThrowsAsync<InvalidOperationException>(() => service.GetAuthHeader(expired, TestContext.Current.CancellationToken));
      http.ShouldNotHaveMadeACall();
    }

    [Fact]
    public async Task CancellationMakesNoRequests()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var clock = new TestClock();
      using var service = new HolderTokenCacheFixture().Create(clock, CreateOptions());
      using var cancellation = new CancellationTokenSource();
      cancellation.Cancel();
      await Assert.ThrowsAsync<OperationCanceledException>(() => service.GetAuthHeader(CreateContext(clock), cancellation.Token));
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
      var page = await client.ListCredentialPage(CreateContext(new TestClock()), "cursor-a", 20, TestContext.Current.CancellationToken);
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
    [InlineData(404)]
    public async Task WalletFailuresPropagateInsteadOfReturningAbsence(int status)
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      http.RespondWithJson(new { error = "failure" }, status);
      var auth = CreateAuth();
      var client = new WalletClient(Options.Create(CreateOptions()), auth.Object);
      var exception = await Assert.ThrowsAsync<HttpClientException>(() => client.GetCredential(CreateContext(new TestClock()), CredentialId, TestContext.Current.CancellationToken));
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
        client.ListCredentialPage(CreateContext(new TestClock()), cancellationToken: TestContext.Current.CancellationToken));

      Assert.Equal(HttpStatusCode.ServiceUnavailable, exception.StatusCode);
      Assert.Single(http.CallLog);
    }

    [Fact]
    public async Task AssertionExchangeFailureUsesSharedHttpErrorWithoutCallingHolderGrant()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      http.ForCallsTo(YomaEndpoint).RespondWith("Invalid assertion client", 401);
      var clock = new TestClock();
      using var service = new HolderTokenCacheFixture().Create(clock, CreateOptions());

      var exception = await Assert.ThrowsAsync<HttpClientException>(() =>
        service.GetAuthHeader(CreateContext(clock), TestContext.Current.CancellationToken));

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
      var clock = new TestClock();
      var cache = new HolderTokenCacheFixture();
      using var service = cache.Create(clock, CreateOptions());
      var context = CreateContext(clock);
      if (holderGrant)
        http.RespondWithJson(new
        {
          access_token = Token(clock, new JObject { ["sub"] = "user-a", ["aud"] = Audience }),
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
      await Assert.ThrowsAsync<InvalidOperationException>(() => client.ListCredentialPage(CreateContext(new TestClock()), cancellationToken: TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task FailedHolderGrantIsNotCachedAndRetryUsesANewAssertion()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var clock = new TestClock();
      http.RespondWithJson(new
      {
        access_token = Token(clock, new JObject { ["sub"] = "user-a", ["aud"] = Audience }),
        token_type = "Bearer",
        expires_in = 120
      });
      http.RespondWithJson(new { error = "invalid_grant" }, 400);
      using var service = new HolderTokenCacheFixture().Create(clock, CreateOptions());
      var exception = await Assert.ThrowsAsync<HttpClientException>(() => service.GetAuthHeader(CreateContext(clock), TestContext.Current.CancellationToken));
      Assert.Equal(HttpStatusCode.BadRequest, exception.StatusCode);

      EnqueueTokens(http, clock);
      await service.GetAuthHeader(CreateContext(clock), TestContext.Current.CancellationToken);
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
      var context = CreateContext(new TestClock());

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
      var credential = await client.GetCredential(CreateContext(new TestClock()), CredentialId, TestContext.Current.CancellationToken);
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
        await Assert.ThrowsAsync<NotSupportedException>(() => client.GetCredential(CreateContext(new TestClock()), CredentialId, TestContext.Current.CancellationToken));
      else
        await Assert.ThrowsAsync<InvalidOperationException>(() => client.GetCredential(CreateContext(new TestClock()), CredentialId, TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task TemporaryIssuanceRecoveryReturnsNullButReplayRemainsUnsupported()
    {
      var service = new BackgroundWalletService();
      await Assert.ThrowsAsync<NotSupportedException>(() => service.GetCredentialByIdOrNull("holder-a", ArtifactType.SDJWT, CredentialId));
      Assert.Null(await service.GetCredentialByClientReferentOrNull("holder-a", ArtifactType.SDJWT, new("referent", "issue-a")));
      await Assert.ThrowsAsync<NotSupportedException>(() => service.DeleteCredential("holder-a", ArtifactType.SDJWT, CredentialId));
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
      },
      TokenExchange = new()
      {
        KeycloakBaseUri = "https://yoma.example.test",
        Realm = "yoma",
        ClientId = "assertion-client",
        ClientSecret = "test-only"
      }
    };

    private static HolderContext CreateContext(TestClock clock, string holderId = "holder-a", string jti = "input-a") => new()
    {
      AccessToken = Token(clock, new JObject { ["sub"] = "user-a", ["jti"] = jti }, 600),
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

    private static void EnqueueTokens(HttpTest http, TestClock clock, string holderId = "holder-a", JObject? holderClaims = null)
    {
      http.RespondWithJson(new { access_token = Token(clock, new JObject { ["sub"] = "user-a", ["aud"] = Audience }), token_type = "Bearer", expires_in = 120 });
      http.RespondWithJson(new { access_token = Token(clock, holderClaims ?? HolderClaims(holderId)), token_type = "Bearer", expires_in = 120 });
    }

    private static string Token(TestClock clock, JObject claims, int lifetime = 120)
    {
      claims["exp"] = clock.Now.AddSeconds(lifetime).ToUnixTimeSeconds();
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

    private sealed class TestClock : TimeProvider
    {
      public DateTimeOffset Now { get; set; } = new(2026, 11, 2, 0, 0, 0, TimeSpan.Zero);
      public override DateTimeOffset GetUtcNow() => Now;
    }
    #endregion
  }
}
