using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Yoma.Core.Domain.Exceptions;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class HttpContextAccessorHelper
  {
    public static string GetUsernameSystem => Constants.ModifiedBy_System_Username;

    public static bool UserContextAvailable(IHttpContextAccessor? httpContextAccessor)
    {
      var claimsPrincipal = httpContextAccessor?.HttpContext?.User;
      var result = claimsPrincipal?.Identity?.Name;

      return !string.IsNullOrEmpty(result);
    }

    public static string GetUsername(IHttpContextAccessor? httpContextAccessor, bool useSystemDefault)
    {
      var claimsPrincipal = httpContextAccessor?.HttpContext?.User;
      var result = claimsPrincipal?.Identity?.Name;
      if (string.IsNullOrEmpty(result))
      {
        if (!useSystemDefault) throw new SecurityException("Unauthorized: User context not available");
        result = Constants.ModifiedBy_System_Username;
      }

      return result;
    }

    public static bool IsAdminRole(IHttpContextAccessor? httpContextAccessor)
    {
      var claimsPrincipal = httpContextAccessor?.HttpContext?.User;
      if (claimsPrincipal == null) return false;

      return claimsPrincipal.IsInRole(Constants.Role_Admin);
    }

    public static bool IsUserRoleOnly(IHttpContextAccessor? httpContextAccessor)
    {
      var claimsPrincipal = httpContextAccessor?.HttpContext?.User;
      if (claimsPrincipal == null) return false;

      if (claimsPrincipal.IsInRole(Constants.Role_Admin)) return false;
      if (claimsPrincipal.IsInRole(Constants.Role_OrganizationAdmin)) return false;
      return claimsPrincipal.IsInRole(Constants.Role_User);
    }

    public static void UpdateUsername(IHttpContextAccessor? httpContextAccessor, string newEmail)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(newEmail);
      newEmail = newEmail.Trim();

      var claimsPrincipal = httpContextAccessor?.HttpContext?.User;
      ArgumentNullException.ThrowIfNull(claimsPrincipal);

      var identity = claimsPrincipal.Identity as ClaimsIdentity;
      ArgumentNullException.ThrowIfNull(identity);

      var existingPreferredUsernameClaim = identity.FindFirst("preferred_username");
      if (existingPreferredUsernameClaim != null)
        identity.RemoveClaim(existingPreferredUsernameClaim);

      var existingEmailClaim = identity.FindFirst(ClaimTypes.Email);
      if (existingEmailClaim != null)
        identity.RemoveClaim(existingEmailClaim);

      identity.AddClaim(new Claim("preferred_username", newEmail));
      identity.AddClaim(new Claim(ClaimTypes.Email, newEmail));
    }
  }
}
