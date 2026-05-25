using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Infrastructure.Alison.Models;

namespace Yoma.Core.Infrastructure.Alison.Extensions
{
  public static class AuthenticationRequestExtensions
  {
    public static UserAuthenticationRequest ToUserAuthenticationRequest(this SyncRequestUserAuthentication request)
    {
      ArgumentNullException.ThrowIfNull(request);

      var email = request.Email?.Trim();
      if (string.IsNullOrWhiteSpace(email))
        email = request.Username?.Trim();

      if (string.IsNullOrWhiteSpace(email))
        throw new InvalidOperationException("Yoma user email or username is required for Alison user authentication");

      return new UserAuthenticationRequest
      {
        Email = email,
        FirstName = string.IsNullOrWhiteSpace(request.FirstName) ? null : request.FirstName.Trim(),
        LastName = string.IsNullOrWhiteSpace(request.Surname) ? null : request.Surname.Trim()
      };
    }
  }
}
