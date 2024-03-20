using Microsoft.AspNetCore.Authorization;

namespace Yoma.Core.Api.Middleware
{
  public class RequireScopeAuthorizationRequirement : IAuthorizationRequirement
  {
    public string Scope { get; }

    public RequireScopeAuthorizationRequirement(string scope)
    {
      Scope = scope;
    }
  }
}
