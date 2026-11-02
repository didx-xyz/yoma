using Microsoft.AspNetCore.Authorization;

namespace Yoma.Core.Api.Middleware
{
  public class RequireAudienceClaimHandler : AuthorizationHandler<RequireAudienceClaimRequirement>
  {
    public RequireAudienceClaimHandler() { }

    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, RequireAudienceClaimRequirement requirement)
    {
      // JWT audience arrays become separate claims; the API audience need not be first.
      if (context.User.FindAll("aud").Any(claim => claim.Value.Split(' ').Contains(requirement.Audience)))
      {
        context.Succeed(requirement);
      }

      return Task.CompletedTask;
    }
  }
}
