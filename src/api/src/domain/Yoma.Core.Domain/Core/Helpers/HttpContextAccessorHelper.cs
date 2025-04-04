using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Yoma.Core.Domain.Core.Exceptions;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class HttpContextAccessorHelper
  {
    public static string GetUsernameSystem => Constants.System_Username_ModifiedBy;

    public static HashSet<string> DefinedRoles => [Constants.Role_User, Constants.Role_Admin, Constants.Role_OrganizationAdmin];

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
        result = Constants.System_Username_ModifiedBy;
      }

      return result;
    }

    public static bool IsAdminRole(IHttpContextAccessor? httpContextAccessor)
    {
      var claimsPrincipal = httpContextAccessor?.HttpContext?.User;
      if (claimsPrincipal == null) return false;

      return claimsPrincipal.IsInRole(Constants.Role_Admin);
    }

    public static bool IsOrganizationAdminRole(IHttpContextAccessor? httpContextAccessor)
    {
      var claimsPrincipal = httpContextAccessor?.HttpContext?.User;
      if (claimsPrincipal == null) return false;

      return claimsPrincipal.IsInRole(Constants.Role_OrganizationAdmin);
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
      ArgumentException.ThrowIfNullOrWhiteSpace(newEmail, nameof(newEmail));
      newEmail = newEmail.Trim();

      var claimsPrincipal = httpContextAccessor?.HttpContext?.User;
      ArgumentNullException.ThrowIfNull(claimsPrincipal, nameof(claimsPrincipal));

      var identity = claimsPrincipal.Identity as ClaimsIdentity;
      ArgumentNullException.ThrowIfNull(identity, nameof(identity));

      var existingPreferredUsernameClaim = identity.FindFirst("preferred_username");
      if (existingPreferredUsernameClaim != null)
        identity.RemoveClaim(existingPreferredUsernameClaim);

      var existingEmailClaim = identity.FindFirst(ClaimTypes.Email);
      if (existingEmailClaim != null)
        identity.RemoveClaim(existingEmailClaim);

      identity.AddClaim(new Claim("preferred_username", newEmail));
      identity.AddClaim(new Claim(ClaimTypes.Email, newEmail));
    }

    public static List<string> GetRoles(IHttpContextAccessor? httpContextAccessor)
    {
      var claimsPrincipal = httpContextAccessor?.HttpContext?.User;
      ArgumentNullException.ThrowIfNull(claimsPrincipal, nameof(claimsPrincipal));

      var results = claimsPrincipal.Claims
          .Where(claim => claim.Type == Constants.ClaimType_Role && DefinedRoles.Contains(claim.Value))
          .Select(claim => claim.Value)
          .ToList();

      return results;
    }
  }
}
