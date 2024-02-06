using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Api.Middleware
{
    public class RequireAudienceClaimHandler : AuthorizationHandler<RequireAudienceClaimRequirement>
    {
        private readonly AppSettings _appSettings;

        public RequireAudienceClaimHandler(IOptions<AppSettings> appSettings)
        {
            _appSettings = appSettings.Value;
        }

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
