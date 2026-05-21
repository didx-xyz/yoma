using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Infrastructure.Alison.Interfaces;
using Yoma.Core.Infrastructure.Alison.Models;

namespace Yoma.Core.Infrastructure.Alison.Services
{
  public sealed class AlisonAuthService : IAlisonAuthService
  {
    #region Class Variables
    private static AccessTokenResponse? _accessToken;
    private static readonly SemaphoreSlim AccessTokenLock = new(1, 1);

    private readonly ILogger<AlisonAuthService> _logger;
    private readonly AlisonOptions _options;
    #endregion

    #region Constructor
    public AlisonAuthService(
      ILogger<AlisonAuthService> logger,
      IOptions<AlisonOptions> options)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
    }
    #endregion

    #region Public Members
    public async Task<KeyValuePair<string, string>> GetAuthHeader()
    {
      if (_accessToken != null && _accessToken.DateExpire > DateTimeOffset.UtcNow)
        return new KeyValuePair<string, string>(Constants.Header_Authorization, $"{Constants.Header_Authorization_Value_Prefix} {_accessToken.AccessToken}");

      await AccessTokenLock.WaitAsync();

      try
      {
        if (_accessToken != null && _accessToken.DateExpire > DateTimeOffset.UtcNow)
          return new KeyValuePair<string, string>(Constants.Header_Authorization, $"{Constants.Header_Authorization_Value_Prefix} {_accessToken.AccessToken}");

        _accessToken = await GetAccessToken();

        return new KeyValuePair<string, string>(Constants.Header_Authorization, $"{Constants.Header_Authorization_Value_Prefix} {_accessToken.AccessToken}");
      }
      finally
      {
        AccessTokenLock.Release();
      }
    }
    #endregion

    #region Private Members
    private async Task<AccessTokenResponse> GetAccessToken()
    {
      var request = new AccessTokenRequest
      {
        ClientId = _options.ClientId,
        ClientSecret = _options.ClientSecret
      };

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Requesting Alison access token");

      var response = await _options.BaseUrl
        .AppendPathSegment(_options.AccessTokenPath)
        .WithTimeout(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds))
        .PostJsonAsync(request)
        .EnsureSuccessStatusCodeAsync()
        .ReceiveJson<AccessTokenResponse>();

      if (string.IsNullOrWhiteSpace(response.AccessToken))
        throw new InvalidOperationException("Alison access token response did not contain an access token");

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Successfully acquired Alison access token with token type '{tokenType}'", response.TokenType);

      return response;
    }
    #endregion
  }
}
