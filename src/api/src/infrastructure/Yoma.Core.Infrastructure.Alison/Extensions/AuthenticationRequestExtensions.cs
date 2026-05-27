using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Infrastructure.Alison.Models;

namespace Yoma.Core.Infrastructure.Alison.Extensions
{
  public static class AuthenticationRequestExtensions
  {
    public static object ToUserAuthenticationRequest(this SyncRequestUserAuthentication request, UserAuthenticationRequestType requestType)
    {
      ArgumentNullException.ThrowIfNull(request);

      var email = request.Email?.Trim();
      if (string.IsNullOrWhiteSpace(email))
        throw new InvalidOperationException("Alison user authentication requires email");

      return requestType switch
      {
        UserAuthenticationRequestType.Register => ToUserRegisterRequest(request, email),
        UserAuthenticationRequestType.Login => new UserLoginRequest
        {
          Email = email
        },
        _ => throw new InvalidOperationException($"Unsupported Alison user authentication request type '{requestType}'")
      };
    }

    private static UserRegisterRequest ToUserRegisterRequest(SyncRequestUserAuthentication request, string email)
    {
      request.FirstName = request.FirstName?.Trim();
      request.Surname = request.Surname?.Trim();

      if (string.IsNullOrEmpty(request.FirstName))
        throw new ArgumentNullException(nameof(request), "First name required");

      if (string.IsNullOrEmpty(request.Surname))
        throw new ArgumentNullException(nameof(request), "Surname required");

      if (request.Country == null)
        throw new ArgumentNullException(nameof(request), "Country required");

      return new UserRegisterRequest
      {
        Email = email,
        FirstName = request.FirstName,
        LastName = request.Surname,
        City = request.Country.CodeAlpha2,
        Country = request.Country.CodeAlpha2
      };
    }
  }
}
