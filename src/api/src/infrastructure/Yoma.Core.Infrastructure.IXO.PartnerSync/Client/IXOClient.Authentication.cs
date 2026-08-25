using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Infrastructure.IXO.PartnerSync.Models;

namespace Yoma.Core.Infrastructure.IXO.PartnerSync.Client
{
  public sealed partial class IXOClient
  {
    #region Private Members
    private async Task<SyncResultUserAuthentication> AuthenticateFromApi(
      SyncRequestUserAuthentication request)
    {
      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug(
          "Executing IXO user access hand-off for Yoma user '{userId}' and opportunity '{opportunityExternalId}'",
          request.UserId, request.EntitySyncInfo.ExternalId);

      var response = await _options.BaseUrl
        .AppendPathSegment(_options.UserAccessPath)
        .WithAuthHeader(await _ixoAuthService.GetAuthHeader())
        .WithTimeout(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds))
        .PostJsonAsync(ToUserAccessRequest(request))
        .EnsureSuccessStatusCodeAsync()
        .ReceiveJson<UserAccessResponse>();

      ValidateUserAccessResponse(response);

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation(
          "Completed IXO user access hand-off for Yoma user '{userId}' and opportunity '{opportunityExternalId}'",
          request.UserId, request.EntitySyncInfo.ExternalId);

      return new SyncResultUserAuthentication
      {
        URL = BuildAutoLoginUrl(
          response.AutoLoginUrlPattern,
          response.Token,
          request.EntitySyncInfo.ExternalId!),
        UserSyncInfo = new SyncInfoUserPartner
        {
          Partner = SyncPartner.IXO,
          ExternalId = response.PartnerUserId.Trim(),
          DateLastRedirect = DateTimeOffset.UtcNow
        }
      };
    }

    private static void ValidateUserAccessRequest(SyncRequestUserAuthentication request)
    {
      ArgumentNullException.ThrowIfNull(request.EntitySyncInfo);

      if (request.EntitySyncInfo.Partner != SyncPartner.IXO)
        throw new InvalidOperationException($"Partner '{request.EntitySyncInfo.Partner}' not supported by IXO user authentication");

      request.EntitySyncInfo.ExternalId = request.EntitySyncInfo.ExternalId?.Trim();
      request.EntitySyncInfo.URL = request.EntitySyncInfo.URL?.Trim();
      request.Username = request.Username?.Trim()!;
      request.Email = request.Email?.Trim();
      request.PhoneNumber = request.PhoneNumber?.Trim();
      request.FirstName = request.FirstName?.Trim();
      request.Surname = request.Surname?.Trim();

      if (string.IsNullOrEmpty(request.EntitySyncInfo.ExternalId))
        throw new InvalidOperationException("IXO opportunity external id is required for user authentication");

      if (string.IsNullOrEmpty(request.EntitySyncInfo.URL))
        throw new InvalidOperationException("Default IXO navigation URL is required for user authentication");

      if (string.IsNullOrEmpty(request.Username))
        throw new InvalidOperationException("Yoma username is required for IXO user authentication");

      if (string.IsNullOrEmpty(request.FirstName))
        throw new InvalidOperationException("Yoma user first name is required for IXO user authentication");

      if (string.IsNullOrEmpty(request.Surname))
        throw new InvalidOperationException("Yoma user surname is required for IXO user authentication");

      if (request.Country == null)
        throw new InvalidOperationException("Yoma user country is required for IXO user authentication");
    }

    private static UserAccessRequest ToUserAccessRequest(SyncRequestUserAuthentication request)
    {
      return new UserAccessRequest
      {
        OpportunityExternalId = request.EntitySyncInfo.ExternalId!,
        Profile = new UserProfile
        {
          UserId = request.UserId.ToString(),
          Username = request.Username,
          FirstName = request.FirstName!,
          Surname = request.Surname!,
          Country = request.Country!.CodeAlpha2,
          Email = request.Email,
          Mobile = request.PhoneNumber
        }
      };
    }

    private static void ValidateUserAccessResponse(UserAccessResponse response)
    {
      ArgumentNullException.ThrowIfNull(response);

      if (string.IsNullOrWhiteSpace(response.Token))
        throw new InvalidOperationException("IXO user access response token is required");

      if (!string.Equals(response.TokenType?.Trim(), "bearer", StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException($"IXO user access response token type '{response.TokenType}' is not supported");

      if (response.ExpiresIn <= 0)
        throw new InvalidOperationException("IXO user access response expiry must be greater than zero");

      if (string.IsNullOrWhiteSpace(response.PartnerUserId))
        throw new InvalidOperationException("IXO user access response partner user id is required");

      if (string.IsNullOrWhiteSpace(response.AutoLoginUrlPattern))
        throw new InvalidOperationException("IXO user access response auto-login URL pattern is required");
    }

    private static string BuildAutoLoginUrl(
      string pattern,
      string token,
      string opportunityExternalId)
    {
      var result = pattern.Trim();

      if (!result.Contains("{token}", StringComparison.Ordinal))
        throw new InvalidOperationException("IXO auto-login URL pattern does not contain the required '{token}' placeholder");

      result = result.Replace(
        "{token}",
        Uri.EscapeDataString(token),
        StringComparison.Ordinal);

      var encodedOpportunity = Uri.EscapeDataString(opportunityExternalId);
      var replacedOpportunity = false;

      foreach (var placeholder in new[]
      {
        "{opportunityId}",
        "{opportunity}",
        "{opportunityExternalId}"
      })
      {
        if (!result.Contains(placeholder, StringComparison.Ordinal))
          continue;

        result = result.Replace(placeholder, encodedOpportunity, StringComparison.Ordinal);
        replacedOpportunity = true;
      }

      if (!replacedOpportunity)
        throw new InvalidOperationException("IXO auto-login URL pattern does not contain an opportunity placeholder");

      if (!Uri.TryCreate(result, UriKind.Absolute, out _))
        throw new InvalidOperationException("IXO auto-login URL pattern produced an invalid absolute URL");

      return result;
    }
    #endregion
  }
}
