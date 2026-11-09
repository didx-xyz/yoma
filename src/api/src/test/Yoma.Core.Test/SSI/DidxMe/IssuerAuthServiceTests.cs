using Flurl.Http;
using Flurl.Http.Newtonsoft;
using Flurl.Http.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;
using Xunit;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Infrastructure.DidxMe.Interfaces;
using Yoma.Core.Infrastructure.DidxMe.Models;
using Yoma.Core.Infrastructure.DidxMe.Services;

namespace Yoma.Core.Test.SSI.DidxMe
{
  public class IssuerAuthServiceTests
  {
    #region Class Variables
    private const string TokenEndpoint = "https://identity.example.test/iam/realms/product-hub/protocol/openid-connect/token";
    #endregion

    #region Tests
    [Theory]
    [InlineData(30, 108)]
    [InlineData(5, 115)]
    [InlineData(0, 120)]
    public async Task CachedTokenRefreshesBeforeExpiry(int bufferSeconds, int refreshAfterSeconds)
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      http.RespondWithJson(new { access_token = "first-token", token_type = "Bearer", expires_in = 120 });
      http.RespondWithJson(new { access_token = "second-token", token_type = "Bearer", expires_in = 120 });
      var clock = new TestTimeProvider();
      using var service = CreateService(clock, bufferSeconds: bufferSeconds);

      var first = await service.GetAuthHeader(TestContext.Current.CancellationToken);
      var cached = await service.GetAuthHeader(TestContext.Current.CancellationToken);
      Assert.Equal(first, cached);
      Assert.Equal("Authorization", first.Key);
      Assert.Equal("Bearer first-token", first.Value);
      http.ShouldHaveCalled(TokenEndpoint)
        .WithVerb(HttpMethod.Post)
        .WithRequestBody("*grant_type=client_credentials*client_id=yoma-issuer*client_secret=unit-test-secret*")
        .Times(1);

      // Configured buffers are capped at ten percent of the token lifetime.
      clock.Advance(TimeSpan.FromSeconds(refreshAfterSeconds - 1));
      Assert.Equal(first, await service.GetAuthHeader(TestContext.Current.CancellationToken));
      http.ShouldHaveCalled(TokenEndpoint).Times(1);
      clock.Advance(TimeSpan.FromSeconds(1));

      Assert.Equal("Bearer second-token", (await service.GetAuthHeader(TestContext.Current.CancellationToken)).Value);
      http.ShouldHaveCalled(TokenEndpoint).Times(2);
    }

    [Fact]
    public async Task IssuerCachesAreNotSharedAcrossServiceInstances()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      http.RespondWithJson(new { access_token = "issuer-a-token", token_type = "Bearer", expires_in = 120 });
      http.RespondWithJson(new { access_token = "issuer-b-token", token_type = "Bearer", expires_in = 120 });
      var clock = new TestTimeProvider();
      using var issuerA = CreateService(clock, "issuer-a");
      using var issuerB = CreateService(clock, "issuer-b");

      Assert.Equal("Bearer issuer-a-token", (await issuerA.GetAuthHeader(TestContext.Current.CancellationToken)).Value);
      Assert.Equal("Bearer issuer-b-token", (await issuerB.GetAuthHeader(TestContext.Current.CancellationToken)).Value);
      Assert.Equal("Bearer issuer-a-token", (await issuerA.GetAuthHeader(TestContext.Current.CancellationToken)).Value);
      http.ShouldHaveCalled(TokenEndpoint).Times(2);
    }

    [Theory]
    [InlineData(null, "Bearer", 120)]
    [InlineData("", "Bearer", 120)]
    [InlineData("invalid-token", "Basic", 120)]
    [InlineData("invalid-token", "Bearer", 0)]
    [InlineData("invalid-token", "Bearer", -1)]
    public async Task InvalidTokenResponsesAreNotCached(string? token, string tokenType, int expiresIn)
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      http.RespondWithJson(new { access_token = token, token_type = tokenType, expires_in = expiresIn });
      http.RespondWithJson(new { access_token = "valid-token", token_type = "Bearer", expires_in = 120 });
      using var service = CreateService(new TestTimeProvider());

      await Assert.ThrowsAsync<InvalidOperationException>(() => service.GetAuthHeader(TestContext.Current.CancellationToken));

      Assert.Equal("Bearer valid-token", (await service.GetAuthHeader(TestContext.Current.CancellationToken)).Value);
      http.ShouldHaveCalled(TokenEndpoint).Times(2);
    }

    [Fact]
    public async Task AuthenticationFailurePropagatesAndCanBeRetried()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      http.RespondWithJson(new { error = "invalid_client" }, 401);
      http.RespondWithJson(new { access_token = "valid-token", token_type = "Bearer", expires_in = 120 });
      using var service = CreateService(new TestTimeProvider());

      var exception = await Assert.ThrowsAsync<HttpClientException>(() => service.GetAuthHeader(TestContext.Current.CancellationToken));
      Assert.Equal(HttpStatusCode.Unauthorized, exception.StatusCode);

      Assert.Equal("Bearer valid-token", (await service.GetAuthHeader(TestContext.Current.CancellationToken)).Value);
      http.ShouldHaveCalled(TokenEndpoint).Times(2);
    }

    [Fact]
    public async Task CancelledRequestDoesNotAcquireAToken()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      using var service = CreateService(new TestTimeProvider());
      using var cancellation = new CancellationTokenSource();
      cancellation.Cancel();

      await Assert.ThrowsAsync<OperationCanceledException>(() => service.GetAuthHeader(cancellation.Token));

      http.ShouldNotHaveMadeACall();
    }

    [Fact]
    public void InfrastructureRegistrationPreservesExistingSSIProvider()
    {
      var existingProvider = Mock.Of<ISSIProviderClientFactory>();
      var services = new ServiceCollection();
      services.AddLogging();
      services.AddSingleton(existingProvider);
      var tokenCache = new HolderTokenCacheFixture();
      services.AddSingleton(tokenCache.Cache.Object);
      services.AddSingleton(tokenCache.Lock.Object);
      services.AddSingleton(tokenCache.Encryption);
      var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
      {
        ["DidxMe:TenantAlias"] = "yoma",
        ["DidxMe:KeycloakBaseUri"] = "https://identity.example.test/iam",
        ["DidxMe:Issuer:Realm"] = "product-hub",
        ["DidxMe:Issuer:ClientId"] = "yoma-issuer",
        ["DidxMe:Issuer:ClientSecret"] = "unit-test-secret",
        ["DidxMe:Holder:ClientId"] = "yoma-federated-lite"
      }).Build();

      Infrastructure.DidxMe.Startup.ConfigureServices_DidxMe(services, configuration);
      using var provider = services.BuildServiceProvider(new ServiceProviderOptions { ValidateOnBuild = true });

      Assert.Same(existingProvider, provider.GetRequiredService<ISSIProviderClientFactory>());
      Assert.Same(provider.GetRequiredService<IIssuerAuthService>(), provider.GetRequiredService<IIssuerAuthService>());
      using var firstRequest = provider.CreateScope();
      using var secondRequest = provider.CreateScope();
      var holderAuth = firstRequest.ServiceProvider.GetRequiredService<IHolderAuthService>();
      Assert.Same(holderAuth, firstRequest.ServiceProvider.GetRequiredService<IHolderAuthService>());
      Assert.NotSame(holderAuth, secondRequest.ServiceProvider.GetRequiredService<IHolderAuthService>());
      Assert.Same(firstRequest.ServiceProvider.GetRequiredService<IIssuerAuthService>(),
        secondRequest.ServiceProvider.GetRequiredService<IIssuerAuthService>());
      var options = provider.GetRequiredService<IOptions<ProviderOptions>>().Value;
      Assert.Equal("yoma-issuer", options.Issuer.ClientId);
      Assert.Equal("yoma-federated-lite", options.Holder.ClientId);
    }
    [Theory]
    [InlineData("RequestTimeoutSeconds", "0")]
    [InlineData("RequestTimeoutSeconds", "-1")]
    [InlineData("IssuerRequestTimeoutSeconds", "0")]
    [InlineData("IssuerRequestTimeoutSeconds", "-1")]
    [InlineData("AccessTokenRefreshBufferSeconds", "-1")]
    public void InvalidTimingConfigurationIsRejected(string setting, string value)
    {
      var services = new ServiceCollection();
      var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
      {
        [$"DidxMe:{setting}"] = value
      }).Build();
      Infrastructure.DidxMe.Startup.ConfigureServices_DidxMe(services, configuration);
      using var provider = services.BuildServiceProvider();

      Assert.Throws<OptionsValidationException>(() => provider.GetRequiredService<IOptions<ProviderOptions>>().Value);
    }
    #endregion

    #region Private Members
    private static IssuerAuthService CreateService(TimeProvider clock, string clientId = "yoma-issuer", int bufferSeconds = 30)
    {
      return new IssuerAuthService(Options.Create(new ProviderOptions
      {
        AccessTokenRefreshBufferSeconds = bufferSeconds,
        KeycloakBaseUri = "https://identity.example.test/iam",
        Issuer = new IssuerOptions
        {
          Realm = "product-hub",
          ClientId = clientId,
          ClientSecret = "unit-test-secret"
        }
      }), clock);
    }

    private sealed class TestTimeProvider : TimeProvider
    {
      private DateTimeOffset _now = new(2026, 10, 28, 0, 0, 0, TimeSpan.Zero);

      public override DateTimeOffset GetUtcNow() => _now;

      public void Advance(TimeSpan duration) => _now += duration;
    }
    #endregion
  }
}
