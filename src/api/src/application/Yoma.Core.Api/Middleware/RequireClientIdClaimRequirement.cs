using Microsoft.AspNetCore.Authorization;

namespace Yoma.Core.Api.Middleware
{
    public class RequireClientIdClaimRequirement : IAuthorizationRequirement
    {
        // No specific properties are needed for this requirement
    }
}
