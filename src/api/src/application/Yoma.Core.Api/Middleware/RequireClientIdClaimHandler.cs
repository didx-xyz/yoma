using Microsoft.AspNetCore.Authorization;

namespace Yoma.Core.Api.Middleware
{
    public class RequireClientIdClaimHandler : AuthorizationHandler<RequireClientIdClaimRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, RequireClientIdClaimRequirement requirement)
        {
            var clientIdClaim = context.User.FindFirst("client_id");

            if (clientIdClaim != null)
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}
