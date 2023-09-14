using FS.Keycloak.RestApiClient.Model;
using Yoma.Core.Domain.IdentityProvider.Models;
using Yoma.Core.Domain.Core.Extensions;

namespace Yoma.Core.Infrastructure.Keycloak.Extensions
{
    public static class UserExtensions
    {
        public static User ToUser(this UserRepresentation kcUser)
        {
            if (kcUser == null)
                throw new ArgumentNullException(nameof(kcUser));

            var result = new User
            {
                Id = Guid.Parse(kcUser.Id),
                Username = kcUser.Username,
                Email = kcUser.Email.Trim(),
                FirstName = kcUser.FirstName.Trim(),
                LastName = kcUser.LastName.Trim(),
                PhoneNumber = kcUser.Attributes.Keys.Contains(CustomAttributes.PhoneNumber.ToDescription())
                  ? kcUser.Attributes[CustomAttributes.PhoneNumber.ToDescription()].FirstOrDefault()?.Trim() : null,
                Gender = kcUser.Attributes.Keys.Contains(CustomAttributes.Gender.ToDescription())
                  ? kcUser.Attributes[CustomAttributes.Gender.ToDescription()].FirstOrDefault()?.Trim() : null,
                CountryOfOrigin = kcUser.Attributes.Keys.Contains(CustomAttributes.CountryOfOrigin.ToDescription())
                  ? kcUser.Attributes[CustomAttributes.CountryOfOrigin.ToDescription()].FirstOrDefault()?.Trim() : null,
                CountryOfResidence = kcUser.Attributes.Keys.Contains(CustomAttributes.CountryOfResidence.ToDescription())
                  ? kcUser.Attributes[CustomAttributes.CountryOfResidence.ToDescription()].FirstOrDefault()?.Trim() : null,
                DateOfBirth = kcUser.Attributes.Keys.Contains(CustomAttributes.DateOfBirth.ToDescription())
                  ? kcUser.Attributes[CustomAttributes.DateOfBirth.ToDescription()].FirstOrDefault()?.Trim() : null,
                EmailVerified = kcUser.EmailVerified.HasValue && kcUser.EmailVerified.Value
            };

            return result;
        }
    }
}
