using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Infrastructure.Alison.Models;

namespace Yoma.Core.Infrastructure.Alison.Extensions
{
  public static class AuthenticationExtensions
  {
    #region Public Members
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

    /// <summary>
    /// Maps a successful Alison register/login response to the Yoma user-authentication result.
    /// </summary>
    public static SyncResultUserAuthentication ToSyncResultUserAuthentication(
      this UserAuthenticationResponse response,
      AlisonOptions options,
      SyncRequestUserAuthentication request,
      string entityExternalId,
      UserAuthenticationRequestType requestType)
    {
      ArgumentNullException.ThrowIfNull(response);
      ArgumentNullException.ThrowIfNull(options);
      ArgumentNullException.ThrowIfNull(request);

      entityExternalId = entityExternalId?.Trim() ?? string.Empty;
      if (string.IsNullOrWhiteSpace(entityExternalId))
        throw new InvalidOperationException("Alison course external id is required for user authentication");

      var token = response.ResolvedToken?.Trim();
      if (string.IsNullOrWhiteSpace(token))
        throw new InvalidOperationException($"Alison user {requestType} response did not contain a token");

      var externalId = response.ResolvedExternalId?.Trim() ?? request.UserSyncInfo?.ExternalId?.Trim();
      if (string.IsNullOrWhiteSpace(externalId))
        throw new InvalidOperationException($"Alison user {requestType} response did not contain a user external id");

      return new SyncResultUserAuthentication
      {
        URL = options.WebBaseUrl.ToAuthenticatedCourseUrl(token, entityExternalId),
        UserSyncInfo = new SyncInfoUserPartner
        {
          Partner = SyncPartner.Alison,
          ExternalId = externalId,
          DateLastRedirect = DateTimeOffset.UtcNow
        }
      };
    }
    #endregion

    #region Private Members
    private static UserRegisterRequest ToUserRegisterRequest(SyncRequestUserAuthentication request, string email)
    {
      var firstName = request.FirstName?.Trim();
      var surname = request.Surname?.Trim();

      if (string.IsNullOrEmpty(firstName))
        throw new ArgumentNullException(nameof(request), "First name required");

      if (string.IsNullOrEmpty(surname))
        throw new ArgumentNullException(nameof(request), "Surname required");

      if (request.Country == null)
        throw new ArgumentNullException(nameof(request), "Country required");

      return new UserRegisterRequest
      {
        Email = email,
        FirstName = firstName,
        LastName = surname,
        City = request.Country.CodeAlpha2,
        Country = request.Country.CodeAlpha2
      };
    }
    #endregion
  }
}
