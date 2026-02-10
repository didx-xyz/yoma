using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Yoma.Core.Domain.Core;

namespace Yoma.Core.Test.Referral.Fixtures
{
  public static class MockHttpContextAccessor
  {
    public static Mock<IHttpContextAccessor> Create(string username = "testuser@example.com", params string[] roles)
    {
      var claims = new List<Claim>
      {
        new(ClaimTypes.Name, username),
        new("preferred_username", username)
      };

      foreach (var role in roles)
        claims.Add(new Claim(Constants.ClaimType_Role, role));

      // nameType must be ClaimTypes.Name so Identity.Name returns the username
      // roleType must be Constants.ClaimType_Role ("role") so IsInRole() works correctly
      var identity = new ClaimsIdentity(claims, "TestAuth", ClaimTypes.Name, Constants.ClaimType_Role);
      var principal = new ClaimsPrincipal(identity);
      var httpContext = new DefaultHttpContext { User = principal };

      var mock = new Mock<IHttpContextAccessor>();
      mock.Setup(x => x.HttpContext).Returns(httpContext);
      return mock;
    }
  }
}
