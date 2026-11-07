using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Infrastructure.DidxMe.Interfaces;
using Yoma.Core.Infrastructure.DidxMe.Models;

namespace Yoma.Core.Infrastructure.DidxMe.Services
{
  /// <summary>
  /// Acquires organisation client-credentials tokens independently of participant sessions.
  /// Registered as a singleton: one in-memory token per API container, with serialized refresh
  /// and an absolute expiry buffered from the acquisition start time. Replicas acquire their
  /// own tokens; no distributed cache or token persistence is needed. Issuer HTTP 401 responses
  /// invalidate this cache without automatically retrying the failed operation.
  /// </summary>
  public sealed class IssuerAuthService : IIssuerAuthService, IDisposable
  {
    #region Class Variables
    private readonly ProviderOptions _options;
    private readonly TimeProvider _timeProvider;
    private readonly SemaphoreSlim _accessTokenLock = new(1, 1);
    private volatile CachedAccessToken? _accessToken;
    #endregion

    #region Constructor
    public IssuerAuthService(
      IOptions<ProviderOptions> options,
      TimeProvider timeProvider)
    {
      ArgumentNullException.ThrowIfNull(options, nameof(options));

      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
      _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));
    }
    #endregion

    #region Public Members
    public async Task<KeyValuePair<string, string>> GetAuthHeader(CancellationToken cancellationToken = default)
    {
      cancellationToken.ThrowIfCancellationRequested();

      var token = _accessToken;
      if (token != null && token.DateExpire > _timeProvider.GetUtcNow())
        return CreateAuthHeader(token);

      await _accessTokenLock.WaitAsync(cancellationToken);

      try
      {
        token = _accessToken;
        if (token != null && token.DateExpire > _timeProvider.GetUtcNow())
          return CreateAuthHeader(token);

        token = await GetAccessToken(cancellationToken);
        _accessToken = token;

        return CreateAuthHeader(token);
      }
      finally
      {
        _accessTokenLock.Release();
      }
    }

    public void Invalidate() => _accessToken = null;

    public void Dispose()
    {
      _accessTokenLock.Dispose();
    }
    #endregion

    #region Private Members
    private static KeyValuePair<string, string> CreateAuthHeader(CachedAccessToken token)
    {
      return new KeyValuePair<string, string>(
        Constants.HeaderAuthorization,
        $"{Constants.HeaderAuthorizationValuePrefix} {token.Value}");
    }

    private async Task<CachedAccessToken> GetAccessToken(CancellationToken cancellationToken)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(_options.KeycloakBaseUri);
      ArgumentNullException.ThrowIfNull(_options.Issuer);
      ArgumentException.ThrowIfNullOrWhiteSpace(_options.Issuer.Realm);
      ArgumentException.ThrowIfNullOrWhiteSpace(_options.Issuer.ClientId);
      ArgumentException.ThrowIfNullOrWhiteSpace(_options.Issuer.ClientSecret);

      var request = new Dictionary<string, string>
      {
        { "grant_type", "client_credentials" },
        { "client_id", _options.Issuer.ClientId },
        { "client_secret", _options.Issuer.ClientSecret }
      };

      // Count the lifetime from before the request so transport latency cannot extend the cache
      // beyond the authorization server's expiry. Short-lived tokens retain a usable refresh window.
      var requestedAt = _timeProvider.GetUtcNow();
      var response = await _options.KeycloakBaseUri
        .AppendPathSegments("realms", _options.Issuer.Realm, "protocol", "openid-connect", "token")
        .WithTimeout(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds))
        .PostUrlEncodedAsync(request, cancellationToken: cancellationToken)
        .EnsureSuccessStatusCodeAsync()
        .ReceiveJson<AccessTokenResponse>();

      if (response == null || string.IsNullOrWhiteSpace(response.AccessToken))
        throw new InvalidOperationException("didx:me issuer token response did not contain an access token");

      if (!string.Equals(response.TokenType, "Bearer", StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("didx:me issuer token response did not contain a supported token type");

      if (response.ExpiresIn <= 0)
        throw new InvalidOperationException("didx:me issuer token response expiry must be greater than zero");

      var refreshBuffer = Math.Min(_options.AccessTokenRefreshBufferSeconds, response.ExpiresIn / 10d);
      var dateExpire = requestedAt.AddSeconds(response.ExpiresIn - refreshBuffer);
      if (dateExpire <= _timeProvider.GetUtcNow())
        throw new InvalidOperationException("didx:me issuer token expired before it could be cached");

      return new CachedAccessToken
      {
        Value = response.AccessToken,
        DateExpire = dateExpire
      };
    }

    private sealed class CachedAccessToken
    {
      public string Value { get; init; } = null!;

      public DateTimeOffset DateExpire { get; init; }
    }
    #endregion
  }
}
