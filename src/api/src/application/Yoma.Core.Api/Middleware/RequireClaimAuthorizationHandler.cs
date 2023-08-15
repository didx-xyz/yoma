using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Yoma.Core.Api.Common;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Api.Middleware
{
  public class RequiredClaimAuthorizationHandler : AuthorizationHandler<RequireClaimAuthorizationRequirement>
  {
    private readonly AppSettings _appSettings;

    public RequiredClaimAuthorizationHandler(IOptions<AppSettings> appSettings)
    {
      _appSettings = appSettings.Value;
    }

    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, RequireClaimAuthorizationRequirement requirement)
    {
      // check if the "scope" claim exists in the user's claims
      var scopeClaim = context.User.Claims.FirstOrDefault(c => c.Type == Constants.ClaimType_Scope);

      if (scopeClaim != null && scopeClaim.Value.Split(' ').Contains(_appSettings.AuthorizationPolicyScope))
      {
        // user has the required scope, authorize the user
        context.Succeed(requirement);
      }

      // user does not have the required scope, authorization fails
      return Task.CompletedTask;
    }
  }
}
