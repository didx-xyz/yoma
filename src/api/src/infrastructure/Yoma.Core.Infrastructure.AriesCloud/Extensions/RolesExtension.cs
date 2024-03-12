using Aries.CloudAPI.DotnetSDK.AspCore.Clients.Models;
using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Infrastructure.AriesCloud.Extensions
{
    public static class RolesExtension
    {
        public static List<Roles> ToAriesRoles(this List<Role> roles)
        {
            if (roles == null || !roles.Any())
                throw new ArgumentNullException(nameof(roles));

            //holder implicitly assigned to a tenant; all tenants are holders
            return roles
             .Where(role => role != Role.Holder)
             .Select(role =>
             {
                 return role switch
                 {
                     Role.Issuer => Roles.Issuer,
                     Role.Verifier => Roles.Verifier,
                     _ => throw new ArgumentException($"Unsupported role '{role}'", nameof(roles)),
                 };
             })
             .ToList();
        }

        public static List<Role> ToSSIRoles(this ICollection<Roles> roles)
        {
            if (roles == null || !roles.Any())
                throw new ArgumentNullException(nameof(roles));

            return roles
             .Select(role =>
             {
                 return role switch
                 {
                     Roles.Issuer => Role.Issuer,
                     Roles.Verifier => Role.Verifier,
                     _ => throw new ArgumentException($"Unsupported role '{role}'", nameof(roles)),
                 };
             })
             .ToList();
        }
    }
}
