using Flurl.Http;
using Flurl.Http.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Infrastructure.DidxMe.Interfaces;
using Yoma.Core.Infrastructure.DidxMe.Models;
using Yoma.Core.Infrastructure.DidxMe.Services;

namespace Yoma.Core.Test.SSI
{
  public class DidxMeIssuerAuthServiceTests
  {
    #region Class Variables
    private const string TokenEndpoint = "https://identity.example.test/iam/realms/product-hub/protocol/openid-connect/token";
    #endregion

    #region Tests
    [Fact]
    public async Task CachedTokenRefreshesBeforeExpiry()
    {
      using var http = new HttpTest();
      http.RespondWithJson(new { access_token = "first-token", token_type = "Bearer", expires_in = 120 });
      http.RespondWithJson(new { access_token = "second-token", token_type = "Bearer", expires_in = 120 });
      var clock = new TestTimeProvider();
      using var service = CreateService(clock);

      var first = await service.GetAuthHeader(TestContext.Current.CancellationToken);
      var cached = await service.GetAuthHeader(TestContext.Current.CancellationToken);
      Assert.Equal(first, cached);
      Assert.Equal("Authorization", first.Key);
      Assert.Equal("Bearer first-token", first.Value);
      http.ShouldHaveCalled(TokenEndpoint)
        .WithVerb(HttpMethod.Post)
        .WithRequestBody("*grant_type=client_credentials*client_id=yoma-issuer*client_secret=unit-test-secret*")
        .Times(1);

      // The 120-second token refreshes 12 seconds early, without sleeping in the test.
      clock.Advance(TimeSpan.FromSeconds(109));

      Assert.Equal("Bearer second-token", (await service.GetAuthHeader(TestContext.Current.CancellationToken)).Value);
      http.ShouldHaveCalled(TokenEndpoint).Times(2);
    }

    [Fact]
    public async Task IssuerCachesAreNotSharedAcrossServiceInstances()
    {
      using var http = new HttpTest();
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
      using var http = new HttpTest();
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
      using var http = new HttpTest();
      http.RespondWithJson(new { error = "invalid_client" }, 401);
      http.RespondWithJson(new { access_token = "valid-token", token_type = "Bearer", expires_in = 120 });
      using var service = CreateService(new TestTimeProvider());

      await Assert.ThrowsAsync<FlurlHttpException>(() => service.GetAuthHeader(TestContext.Current.CancellationToken));

      Assert.Equal("Bearer valid-token", (await service.GetAuthHeader(TestContext.Current.CancellationToken)).Value);
      http.ShouldHaveCalled(TokenEndpoint).Times(2);
    }

    [Fact]
    public async Task CancelledRequestDoesNotAcquireAToken()
    {
      using var http = new HttpTest();
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
      services.AddSingleton(existingProvider);
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
      Assert.Same(provider.GetRequiredService<IDidxMeIssuerAuthService>(), provider.GetRequiredService<IDidxMeIssuerAuthService>());
      var options = provider.GetRequiredService<IOptions<DidxMeOptions>>().Value;
      Assert.Equal("yoma-issuer", options.Issuer.ClientId);
      Assert.Equal("yoma-federated-lite", options.Holder.ClientId);
    }
    #endregion

    #region Private Members
    private static DidxMeIssuerAuthService CreateService(TimeProvider clock, string clientId = "yoma-issuer")
    {
      return new DidxMeIssuerAuthService(Options.Create(new DidxMeOptions
      {
        KeycloakBaseUri = "https://identity.example.test/iam",
        Issuer = new DidxMeIssuerOptions
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
