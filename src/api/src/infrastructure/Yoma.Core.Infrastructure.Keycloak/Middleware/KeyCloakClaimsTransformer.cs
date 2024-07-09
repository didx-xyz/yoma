using Microsoft.AspNetCore.Authentication;
using Newtonsoft.Json;
using System.Security.Claims;
using Yoma.Core.Domain.Core;

namespace Yoma.Core.Infrastructure.Keycloak.Middleware
{
  public class KeyCloakClaimsTransformer : IClaimsTransformation
  {
    private const string ClaimType_RealmAccess = "realm_access";

    public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
      ArgumentNullException.ThrowIfNull(principal, nameof(principal));

      var claimsIdentity = principal.Identity as ClaimsIdentity ?? throw new ArgumentNullException($"{nameof(principal)}.{principal.Identity}");

      // flatten realm_access because Microsoft identity model doesn't support nested claims
      // by map it to Microsoft identity model, because automatic JWT bearer token mapping already processed here
      if (claimsIdentity.IsAuthenticated && claimsIdentity.HasClaim((claim) => claim.Type == ClaimType_RealmAccess))
      {
        var realmAccessClaim = claimsIdentity.FindFirst((claim) => claim.Type == ClaimType_RealmAccess) ?? throw new InvalidOperationException($"Failed to obtain 'claimsIdentity' '{ClaimType_RealmAccess}'");
        var realmAccessAsDict = JsonConvert.DeserializeObject<Dictionary<string, string[]>>(realmAccessClaim.Value) ?? throw new InvalidOperationException($"Failed to deserialize '{ClaimType_RealmAccess}' as {nameof(Dictionary<string, string[]>)}");
        if (realmAccessAsDict["roles"] != null)
        {
          foreach (var role in realmAccessAsDict["roles"])
          {
            claimsIdentity.AddClaim(new Claim(Constants.ClaimType_Role, role));
          }
        }
      }

      return Task.FromResult(principal);
    }
  }
}
