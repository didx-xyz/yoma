using Keycloak.AuthServices.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Newtonsoft.Json.Linq;
using System.Net;
using Xunit;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Infrastructure.Keycloak.Client;
using Yoma.Core.Infrastructure.Keycloak.Models;

namespace Yoma.Core.Test.Core
{
  public class KeycloakRoleTests
  {
    #region Tests
    [Theory]
    [InlineData(true, true, "POST")]
    [InlineData(false, true, "DELETE")]
    [InlineData(false, false, null)]
    public async Task RoleChangesUseTheCorrectHttpMethodAndOnlyTheRequestedRole(bool grant, bool hasRoles, string? expectedMethod)
    {
      var userId = Guid.NewGuid();
      var roles = new[]
      {
        new { id = "organization-admin", name = Domain.Core.Constants.Role_OrganizationAdmin },
        new { id = "participant", name = Domain.Core.Constants.Role_User }
      };
      string? method = null;
      JArray? body = null;
      var builder = WebApplication.CreateBuilder();
      builder.Logging.ClearProviders();
      builder.WebHost.UseUrls("http://127.0.0.1:0");
      await using var app = builder.Build();
      app.MapPost("/realms/test/protocol/openid-connect/token", () => Results.Json(new
      {
        access_token = "test-token",
        expires_in = 300,
        token_type = "Bearer"
      }));
      app.MapGet("/admin/realms/test/roles", () => Results.Json(roles));
      app.MapGet($"/admin/realms/test/users/{userId}/role-mappings", () =>
        hasRoles ? Results.Json(new { realmMappings = roles }) : Results.Json(new { }));
      app.MapMethods($"/admin/realms/test/users/{userId}/role-mappings/realm", ["POST", "DELETE"], async context =>
      {
        method = context.Request.Method;
        using var reader = new StreamReader(context.Request.Body);
        body = JArray.Parse(await reader.ReadToEndAsync(context.RequestAborted));
        context.Response.StatusCode = (int)HttpStatusCode.NoContent;
      });
      await app.StartAsync(TestContext.Current.CancellationToken);
      using var client = new KeycloakClient(NullLogger<KeycloakClient>.Instance, new AppSettings(),
        Mock.Of<IEnvironmentProvider>(), new KeycloakAdminOptions
        {
          Admin = new KeycloakCredentials { Realm = "test", Username = "test", Password = "test" }
        }, new KeycloakAuthenticationOptions { AuthServerUrl = app.Urls.Single(), Realm = "test" });

      if (grant)
        await client.EnsureRoles(userId, [Domain.Core.Constants.Role_OrganizationAdmin]);
      else
        await client.RemoveRoles(userId, [Domain.Core.Constants.Role_OrganizationAdmin]);

      Assert.Equal(expectedMethod, method);
      if (expectedMethod == null)
      {
        Assert.Null(body);
        return;
      }

      var role = Assert.Single(body!);
      Assert.Equal("organization-admin", role.Value<string>("id"));
      Assert.Equal(Domain.Core.Constants.Role_OrganizationAdmin, role.Value<string>("name"));
    }
    #endregion
  }
}
