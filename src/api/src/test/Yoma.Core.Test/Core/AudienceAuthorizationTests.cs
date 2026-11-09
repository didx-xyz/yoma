using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Xunit;
using Yoma.Core.Api.Middleware;

namespace Yoma.Core.Test.Core
{
  public class AudienceAuthorizationTests
  {
    #region Tests
    [Theory]
    [InlineData("yoma-didxme-assertion", "yoma-api", true)]
    [InlineData("yoma-api", "account", true)]
    [InlineData("yoma-didxme-assertion", "account", false)]
    [InlineData("yoma-api-other", "account", false)]
    [InlineData("YOMA-API", "account", false)]
    [InlineData("account yoma-api", null, true)]
    [InlineData("yoma-api", null, true)]
    [InlineData(null, null, false)]
    public async Task RequiresExactApiAudienceAcrossAllClaims(string? first, string? second, bool expected)
    {
      var claims = new List<Claim>();
      if (first != null) claims.Add(new Claim("aud", first));
      if (second != null) claims.Add(new Claim("aud", second));

      var requirement = new RequireAudienceClaimRequirement("yoma-api");
      var context = new AuthorizationHandlerContext([requirement],
        new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer")), null);

      await new RequireAudienceClaimHandler().HandleAsync(context);

      Assert.Equal(expected, context.HasSucceeded);
    }
    #endregion Tests
  }
}
