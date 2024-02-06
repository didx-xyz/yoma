using Microsoft.AspNetCore.Authorization;
using Yoma.Core.Api.Common;

namespace Yoma.Core.Api.Middleware
{
    public class RequireScopeAuthorizationHandler : AuthorizationHandler<RequireScopeAuthorizationRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, RequireScopeAuthorizationRequirement requirement)
        {
            var scopeClaim = context.User.Claims.FirstOrDefault(c => c.Type == Constants.ClaimType_Scope);

            if (scopeClaim != null && scopeClaim.Value.Split(' ').Contains(requirement.Scope))
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}
