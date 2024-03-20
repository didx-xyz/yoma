using Microsoft.AspNetCore.Authorization;

namespace Yoma.Core.Api.Middleware
{
  public class RequireAudienceClaimHandler : AuthorizationHandler<RequireAudienceClaimRequirement>
  {
    public RequireAudienceClaimHandler() { }

    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, RequireAudienceClaimRequirement requirement)
    {
      var audienceClaim = context.User.FindFirst("aud")?.Value;

      if (audienceClaim != null && audienceClaim.Split(' ').Contains(requirement.Audience))
      {
        context.Succeed(requirement);
      }

      return Task.CompletedTask;
    }
  }
}
