using AriesCloudAPI.DotnetSDK.AspCore.Clients.Models;
using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Infrastructure.AriesCloud.Extensions
{
    public static class RolesExtension
    {
        public static List<Roles2> ToAriesRoles(this List<Role> roles)
        {
            if (roles == null || !roles.Any())
                throw new ArgumentNullException(nameof(roles));

            //holder implicitly assigned to a tenant; all tenants are holders
            return roles
             .Where(role => role != Role.Holder)
             .Select(role =>
             {
                 switch (role)
                 {
                     case Role.Issuer:
                         return Roles2.Issuer;

                     case Role.Verifier:
                         return Roles2.Verifier;

                     default:
                         throw new ArgumentException($"Unsupported role '{role}'", nameof(roles));
                 }
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
                 switch (role)
                 {
                     case Roles.Issuer:
                         return Role.Issuer;

                     case Roles.Verifier:
                         return Role.Verifier;

                     default:
                         throw new ArgumentException($"Unsupported role '{role}'", nameof(roles));
                 }
             })
             .ToList();
        }
    }
}
