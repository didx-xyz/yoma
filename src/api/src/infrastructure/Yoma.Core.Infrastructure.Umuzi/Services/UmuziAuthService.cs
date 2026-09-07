using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Infrastructure.Umuzi.Interfaces;
using Yoma.Core.Infrastructure.Umuzi.Models;

namespace Yoma.Core.Infrastructure.Umuzi.Services
{
  public sealed class UmuziAuthService : IUmuziAuthService
  {
    #region Class Variables
    private AccessTokenResponse? _accessToken;
    private readonly SemaphoreSlim AccessTokenLock = new(1, 1);

    private readonly ILogger<UmuziAuthService> _logger;
    private readonly UmuziOptions _options;
    #endregion

    #region Constructor
    public UmuziAuthService(
      ILogger<UmuziAuthService> logger,
      IOptions<UmuziOptions> options)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
    }
    #endregion

    #region Public Members
    public async Task<KeyValuePair<string, string>> GetAuthHeader()
    {
      if (_accessToken != null && _accessToken.DateExpire > DateTimeOffset.UtcNow)
        return CreateAuthHeader(_accessToken);

      await AccessTokenLock.WaitAsync();

      try
      {
        if (_accessToken != null && _accessToken.DateExpire > DateTimeOffset.UtcNow)
          return CreateAuthHeader(_accessToken);

        _accessToken = await GetAccessToken();
        return CreateAuthHeader(_accessToken);
      }
      finally
      {
        AccessTokenLock.Release();
      }
    }
    #endregion

    #region Private Members
    private static KeyValuePair<string, string> CreateAuthHeader(AccessTokenResponse token)
    {
      return new KeyValuePair<string, string>(
        Constants.HeaderAuthorization,
        $"{Constants.HeaderAuthorizationValuePrefix} {token.AccessToken}");
    }

    private async Task<AccessTokenResponse> GetAccessToken()
    {
      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Requesting Umuzi access token");

      var response = await _options.BaseUrl
        .AppendPathSegment(_options.AccessTokenPath)
        .WithTimeout(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds))
        .PostJsonAsync(new AccessTokenRequest
        {
          ClientId = _options.ClientId,
          ClientSecret = _options.ClientSecret
        })
        .EnsureSuccessStatusCodeAsync()
        .ReceiveJson<AccessTokenResponse>();

      if (string.IsNullOrWhiteSpace(response.AccessToken))
        throw new InvalidOperationException("Umuzi access token response did not contain an access token");

      if (!string.Equals(response.TokenType?.Trim(), "bearer", StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException($"Umuzi access token response token type '{response.TokenType}' is not supported");

      if (response.ExpiresIn <= 0)
        throw new InvalidOperationException("Umuzi access token response expiry must be greater than zero");

      return response;
    }
    #endregion
  }
}
