using FS.Keycloak.RestApiClient.Model;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.IdentityProvider.Models;

namespace Yoma.Core.Infrastructure.Keycloak.Extensions
{
  public static class UserExtensions
  {
    public static User ToUser(this UserRepresentation kcUser)
    {
      ArgumentNullException.ThrowIfNull(kcUser);

      var result = new User
      {
        Id = Guid.Parse(kcUser.Id),
        Username = kcUser.Username,
        Email = kcUser.Email.Trim(),
        FirstName = kcUser.FirstName.Trim(),
        LastName = kcUser.LastName.Trim(),
        Country = kcUser.Attributes.ContainsKey(CustomAttributes.Country.ToDescription()) ? kcUser.Attributes[CustomAttributes.Country.ToDescription()].FirstOrDefault()?.Trim() : null,
        DateOfBirth = kcUser.Attributes.ContainsKey(CustomAttributes.DateOfBirth.ToDescription()) ? kcUser.Attributes[CustomAttributes.DateOfBirth.ToDescription()].FirstOrDefault()?.Trim() : null,
        Education = kcUser.Attributes.ContainsKey(CustomAttributes.Education.ToDescription()) ? kcUser.Attributes[CustomAttributes.Education.ToDescription()].FirstOrDefault()?.Trim() : null,
        Gender = kcUser.Attributes.ContainsKey(CustomAttributes.Gender.ToDescription()) ? kcUser.Attributes[CustomAttributes.Gender.ToDescription()].FirstOrDefault()?.Trim() : null,
        PhoneNumber = kcUser.Attributes.ContainsKey(CustomAttributes.PhoneNumber.ToDescription()) ? kcUser.Attributes[CustomAttributes.PhoneNumber.ToDescription()].FirstOrDefault()?.Trim() : null,
        EmailVerified = kcUser.EmailVerified.HasValue && kcUser.EmailVerified.Value
      };

      return result;
    }
  }
}
