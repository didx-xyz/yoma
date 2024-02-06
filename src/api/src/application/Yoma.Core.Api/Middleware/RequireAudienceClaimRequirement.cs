using Microsoft.AspNetCore.Authorization;

namespace Yoma.Core.Api.Middleware
{
    public class RequireAudienceClaimRequirement : IAuthorizationRequirement
    {
        public string Audience { get; }

        public RequireAudienceClaimRequirement(string audience)
        {
            Audience = audience;
        }
    }
}
