using Flurl;
using Flurl.Http;
using Flurl.Http.Newtonsoft;
using Flurl.Http.Testing;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Xunit;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Infrastructure.Keycloak.Client;
using Yoma.Core.Infrastructure.Keycloak.Models;

namespace Yoma.Core.Test.Core
{
  public class KeycloakTokenTests
  {
    #region Tests
    [Theory]
    [InlineData("assertion-client", "assertion-client", true)]
    [InlineData("assertion-client", "yoma-web", false)]
    [InlineData("assertion-client", "partner-client", false)]
    [InlineData("assertion-client", "ASSERTION-CLIENT", false)]
    [InlineData("assertion-client", null, false)]
    [InlineData("assertion-client", " ", false)]
    [InlineData(null, "yoma-web", false)]
    [InlineData("", "", false)]
    public void WebhookFilteringOnlyExcludesTheConfiguredTechnicalClient(string? configuredClient, string? eventClient, bool expected)
    {
      var options = Options();
      if (configuredClient == null) options.TokenExchange = null!;
      else options.TokenExchange.ClientId = configuredClient;
      using var http = new HttpTest();
      using var client = Client("https://identity.example.test", options);

      Assert.Equal(expected, client.IsClientActingOnBehalfOfUser(eventClient));
      Assert.Empty(http.CallLog);
    }

    [Theory]
    [InlineData("success")]
    [InlineData("wrong-state")]
    [InlineData("token-failure")]
    [InlineData("wrong-subject")]
    [InlineData("malformed-token")]
    public async Task BackgroundAssertionUsesConfiguredClientAndCleansOnlyItsOwnSession(string scenario)
    {
      var userId = Guid.NewGuid();
      var sessionId = Guid.NewGuid().ToString();
      var otherSessionId = Guid.NewGuid().ToString();
      var sessions = new HashSet<string> { otherSessionId };
      var cleanup = new List<string>();
      var adminAuthorization = new List<string>();
      string? challenge = null;
      string? clientId = null;
      string? clientSecret = null;
      string? verifier = null;
      var userToken = scenario == "malformed-token" ? "invalid-test-token" : Token(scenario == "wrong-subject" ? Guid.NewGuid() : userId, sessionId);
      var options = Options();
      var builder = WebApplication.CreateBuilder();
      builder.Logging.ClearProviders();
      builder.WebHost.UseUrls("http://127.0.0.1:0");
      await using var app = builder.Build();
      app.MapPost("/realms/master/protocol/openid-connect/token", () => Results.Json(new
      {
        access_token = "admin-test-token",
        expires_in = 300,
        token_type = "Bearer"
      }));
      app.MapPost($"/admin/realms/test/users/{userId}/impersonation", (HttpContext context) =>
      {
        adminAuthorization.Add(context.Request.Headers.Authorization.ToString());
        sessions.Add(sessionId);
        context.Response.Cookies.Append("KEYCLOAK_IDENTITY", Token(userId, sessionId), new CookieOptions { Path = "/", Secure = true });
        return Results.Json(new { sameRealm = false });
      });
      app.MapGet("/realms/test/protocol/openid-connect/auth", (HttpContext context) =>
      {
        Assert.Empty(context.Request.Headers.Authorization.ToString());
        Assert.True(context.Request.Cookies.ContainsKey("KEYCLOAK_IDENTITY"));
        Assert.Equal("none", context.Request.Query["prompt"].ToString());
        Assert.Equal("S256", context.Request.Query["code_challenge_method"].ToString());
        Assert.Equal(options.TokenExchange.ClientId, context.Request.Query["client_id"].ToString());
        challenge = context.Request.Query["code_challenge"].ToString();
        var state = scenario == "wrong-state" ? "wrong" : context.Request.Query["state"].ToString();
        return Results.Redirect(options.TokenExchange.RedirectUri.SetQueryParams(new { code = "test-code", state }));
      });
      app.MapPost("/realms/test/protocol/openid-connect/token", async (HttpContext context) =>
      {
        Assert.Empty(context.Request.Headers.Authorization.ToString());
        var form = await context.Request.ReadFormAsync(context.RequestAborted);
        clientId = form["client_id"];
        clientSecret = form["client_secret"];
        verifier = form["code_verifier"];
        Assert.Equal("authorization_code", form["grant_type"].ToString());
        Assert.Equal("test-code", form["code"].ToString());
        Assert.Equal(options.TokenExchange.RedirectUri, form["redirect_uri"].ToString());
        return scenario == "token-failure" ? Results.Json(new { error = "invalid_grant" }, statusCode: 400)
          : Results.Json(new { access_token = userToken, expires_in = 120, token_type = "Bearer" });
      });
      app.MapDelete("/admin/realms/test/sessions/{id}", (string id, HttpContext context) =>
      {
        adminAuthorization.Add(context.Request.Headers.Authorization.ToString());
        cleanup.Add(id);
        sessions.Remove(id);
        return Results.NoContent();
      });
      await app.StartAsync(TestContext.Current.CancellationToken);
      FlurlHttp.ConfigureClientForUrl(app.Urls.Single())
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      using var client = Client(app.Urls.Single(), options);

      if (scenario == "success")
      {
        var result = await client.GetUserAccessToken(userId, TestContext.Current.CancellationToken);
        Assert.Equal(userToken, result.AccessToken);
        // The SDK token model reserves ten seconds before provider expiry.
        Assert.InRange(result.ExpiresIn, 105, 110);
      }
      else if (scenario == "token-failure")
      {
        var error = await Assert.ThrowsAsync<HttpClientException>(() => client.GetUserAccessToken(userId, TestContext.Current.CancellationToken));
        Assert.Equal(HttpStatusCode.BadRequest, error.StatusCode);
      }
      else
        await Assert.ThrowsAsync<InvalidOperationException>(() => client.GetUserAccessToken(userId, TestContext.Current.CancellationToken));

      Assert.Equal(sessionId, Assert.Single(cleanup));
      Assert.Equal(otherSessionId, Assert.Single(sessions));
      Assert.All(adminAuthorization, value =>
      {
        var header = System.Net.Http.Headers.AuthenticationHeaderValue.Parse(value);
        Assert.Equal("Bearer", header.Scheme, ignoreCase: true);
        Assert.Equal("admin-test-token", header.Parameter);
      });
      if (scenario == "wrong-state") Assert.Null(clientId);
      else
      {
        Assert.Equal(options.TokenExchange.ClientId, clientId);
        Assert.Equal(options.TokenExchange.ClientSecret, clientSecret);
        Assert.Equal(challenge, WebEncoders.Base64UrlEncode(SHA256.HashData(Encoding.ASCII.GetBytes(verifier!))));
      }
    }

    [Fact]
    public async Task CancelledAcquisitionDoesNotContactTheIdentityProvider()
    {
      using var client = Client("http://127.0.0.1:1", Options());
      using var cancellation = new CancellationTokenSource();
      cancellation.Cancel();
      await Assert.ThrowsAnyAsync<OperationCanceledException>(() => client.GetUserAccessToken(Guid.NewGuid(), cancellation.Token));
      await Assert.ThrowsAnyAsync<OperationCanceledException>(() => client.ExchangeUserAccessToken("unused", cancellation.Token));
    }
    #endregion

    #region Private Members
    private static KeycloakAdminOptions Options() => new()
    {
      Admin = new KeycloakCredentials { Realm = "master", Username = "test-admin", Password = "test-password" },
      TokenExchange = new TokenExchangeOptions
      {
        ClientId = "assertion-client",
        ClientSecret = "test-secret",
        RedirectUri = "http://127.0.0.1:1/callback",
        RequestTimeoutSeconds = 5
      }
    };

    private static KeycloakClient Client(string url, KeycloakAdminOptions options) => new(
      NullLogger<KeycloakClient>.Instance, new AppSettings(), Mock.Of<IEnvironmentProvider>(), options,
      new Keycloak.AuthServices.Authentication.KeycloakAuthenticationOptions { AuthServerUrl = url, Realm = "test" });

    private static string Token(Guid userId, string sessionId)
    {
      var header = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes("{\"alg\":\"RS256\",\"typ\":\"JWT\"}"));
      var body = WebEncoders.Base64UrlEncode(JsonSerializer.SerializeToUtf8Bytes(new
      {
        sub = userId.ToString(),
        sid = sessionId,
        exp = DateTimeOffset.UtcNow.AddMinutes(5).ToUnixTimeSeconds()
      }));
      return $"{header}.{body}.dGVzdA";
    }
    #endregion
  }
}
