using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.DidxMe.Interfaces;
using Yoma.Core.Infrastructure.DidxMe.Models;

namespace Yoma.Core.Infrastructure.DidxMe.Services
{
  /// <summary>
  /// Exchanges the incoming authenticated Yoma token through Yoma's assertion client and the
  /// didx:me JWT bearer grant. Shares encrypted holder tokens through Yoma's distributed cache,
  /// bound to the exact source token, holder and provider configuration. Data Protection uses
  /// Yoma's shared key ring with a separate didx:me purpose. Reuse ends at the earliest source,
  /// assertion or holder expiry, with buffered exchanged-token deadlines and no sliding extension.
  /// The scoped instance retains one token for paging within a request. No source/assertion token,
  /// refresh token or offline grant is persisted; this does not enable background wallet access.
  /// </summary>
  public sealed class HolderAuthService : IHolderAuthService, IDisposable
  {
    #region Class Variables
    private readonly ProviderOptions _options;
    private readonly TimeProvider _timeProvider;
    private readonly IDistributedCacheService _cache;
    private readonly IDistributedLockService _distributedLock;
    private readonly IEncryptionService _encryption;
    private readonly ILogger<HolderAuthService> _logger;
    private const string CachePrefix = "didxme:holder-token:v1";
    private readonly SemaphoreSlim _tokenLock = new(1, 1);
    private volatile CachedToken? _token;
    #endregion

    #region Constructor
    public HolderAuthService(
      IOptions<ProviderOptions> options,
      TimeProvider timeProvider,
      IDistributedCacheService cache,
      IDistributedLockService distributedLock,
      IEncryptionService encryption,
      ILogger<HolderAuthService> logger)
    {
      ArgumentNullException.ThrowIfNull(options, nameof(options));

      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
      _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));
      _cache = cache ?? throw new ArgumentNullException(nameof(cache));
      _distributedLock = distributedLock ?? throw new ArgumentNullException(nameof(distributedLock));
      _encryption = encryption ?? throw new ArgumentNullException(nameof(encryption));
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
    #endregion

    #region Public Members
    public async Task<KeyValuePair<string, string>> GetAuthHeader(
      HolderContext context,
      CancellationToken cancellationToken = default)
    {
      ArgumentNullException.ThrowIfNull(context, nameof(context));
      ArgumentException.ThrowIfNullOrWhiteSpace(context.AccessToken);
      ArgumentException.ThrowIfNullOrWhiteSpace(context.UserId);
      ArgumentException.ThrowIfNullOrWhiteSpace(context.HolderId);
      cancellationToken.ThrowIfCancellationRequested();

      // This binding check supplements the host's authentication; decoding is not signature validation.
      var source = ReadClaims(context.AccessToken);
      AssertClaim(source, "sub", context.UserId);
      var sourceExpiry = GetExpiry(source);
      if (sourceExpiry <= _timeProvider.GetUtcNow())
        throw new InvalidOperationException("The authenticated Yoma token has expired");

      var key = CacheKey(context);
      await _tokenLock.WaitAsync(cancellationToken);

      try
      {
        var cached = _token;
        if (cached == null || cached.Key != key || cached.HolderId != context.HolderId ||
          cached.DateExpire <= _timeProvider.GetUtcNow())
        {
          cached = await ReadCached(key);
          if (cached == null)
          {
            await WithCacheLock(key, async () =>
            {
              // Another API instance may have populated the entry while this request waited.
              cached = await ReadCached(key);
              if (cached != null) return;

              // Both HTTP legs fit within this budget, leaving a full request timeout as lease margin.
              using var acquisition = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
              acquisition.CancelAfter(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds * 2d));
              try
              {
                cached = await Exchange(context, key, sourceExpiry, acquisition.Token);
              }
              catch (HttpClientException ex) when (ex.StatusCode == HttpStatusCode.BadRequest)
              {
                // Token-exchange rejection blocks wallet access; the shared middleware treats ordinary 400s as Information.
                // Omit the exception and raw response because identity-provider diagnostics may contain sensitive values.
                if (_logger.IsEnabled(LogLevel.Error))
                  _logger.LogError("Holder token exchange failed with HTTP {status}. Check identity-provider logs for the rejection reason.", (int)ex.StatusCode);

                throw;
              }

              var protectedValue = _encryption.Encrypt(JsonConvert.SerializeObject(cached), key);
              var remaining = cached.DateExpire - _timeProvider.GetUtcNow();
              if (remaining <= TimeSpan.Zero)
                throw new InvalidOperationException("Federated holder token expired before caching");

              await _cache.SetAsync(key, protectedValue, remaining);
            }, cancellationToken);
          }
          _token = cached;
        }

        if (cached == null || cached.DateExpire <= _timeProvider.GetUtcNow())
          throw new InvalidOperationException("Federated holder token expired before use");

        return new KeyValuePair<string, string>(
          Constants.HeaderAuthorization,
          $"{Constants.HeaderAuthorizationValuePrefix} {cached.Value}");
      }
      finally
      {
        _tokenLock.Release();
      }
    }

    /// <summary>
    /// Evicts the rejected token across instances. An old 401 must not remove a replacement
    /// acquired by another request; compare under the same lock used for acquisition.
    /// </summary>
    public async Task Invalidate()
    {
      await _tokenLock.WaitAsync();
      try
      {
        var rejected = _token;
        _token = null;
        if (rejected == null) return;

        await WithCacheLock(rejected.Key, async () =>
        {
          var current = await ReadCached(rejected.Key);
          if (current?.Value == rejected.Value)
            await _cache.RemoveAsync(rejected.Key);
        }, CancellationToken.None);
      }
      finally
      {
        _tokenLock.Release();
      }
    }

    public void Dispose() => _tokenLock.Dispose();
    #endregion

    #region Private Members
    private string CacheKey(HolderContext context)
    {
      // Hash the binding, including client-secret rotation; never place tokens, secrets or user IDs in cache keys.
      var binding = JsonConvert.SerializeObject(new object[]
      {
        context.AccessToken, context.UserId, context.HolderId, _options.TenantAlias,
        _options.KeycloakBaseUri, _options.Holder.Realm, _options.Holder.ClientId,
        _options.Holder.ClientSecret, _options.Holder.AssertionAudience, _options.WalletBaseUri,
        _options.TokenExchange.KeycloakBaseUri, _options.TokenExchange.Realm,
        _options.TokenExchange.ClientId, _options.TokenExchange.ClientSecret,
        _options.AccessTokenRefreshBufferSeconds
      });
      return $"{CachePrefix}:{Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(binding)))}";
    }

    private async Task<CachedToken?> ReadCached(string key)
    {
      try
      {
        var protectedValue = await _cache.GetAsync<string>(key);
        if (string.IsNullOrWhiteSpace(protectedValue)) return null;

        var cached = JsonConvert.DeserializeObject<CachedToken>(_encryption.Decrypt(protectedValue, key));
        return cached?.Key == key && !string.IsNullOrWhiteSpace(cached.Value) &&
          cached.DateExpire > _timeProvider.GetUtcNow() ? cached : null;
      }
      catch (CryptographicException)
      {
        // Expired/lost protection keys or tampering: reacquire under the lock, never log payloads.
        return null;
      }
      catch (JsonException)
      {
        return null;
      }
    }

    private async Task WithCacheLock(string key, Func<Task> action, CancellationToken cancellationToken)
    {
      var duration = TimeSpan.FromSeconds(_options.RequestTimeoutSeconds * 3d);
      if (!await _distributedLock.TryRunWithLockAsync(key, duration, duration, action, cancellationToken))
        throw new TimeoutException("Timed out waiting for federated holder token acquisition");
    }

    private async Task<CachedToken> Exchange(
      HolderContext context,
      string key,
      DateTimeOffset sourceExpiry,
      CancellationToken cancellationToken)
    {
      var exchange = _options.TokenExchange;
      ArgumentNullException.ThrowIfNull(exchange);
      ArgumentException.ThrowIfNullOrWhiteSpace(exchange.ClientId);
      ArgumentException.ThrowIfNullOrWhiteSpace(exchange.ClientSecret);
      ArgumentException.ThrowIfNullOrWhiteSpace(_options.Holder.ClientId);
      ArgumentException.ThrowIfNullOrWhiteSpace(_options.Holder.ClientSecret);
      ArgumentException.ThrowIfNullOrWhiteSpace(_options.Holder.AssertionAudience);
      ArgumentException.ThrowIfNullOrWhiteSpace(_options.TenantAlias);

      ArgumentException.ThrowIfNullOrWhiteSpace(exchange.KeycloakBaseUri);
      ArgumentException.ThrowIfNullOrWhiteSpace(exchange.Realm);

      var requestAssertion = new Dictionary<string, string>
      {
        { "grant_type", "urn:ietf:params:oauth:grant-type:token-exchange" },
        { "client_id", exchange.ClientId },
        { "client_secret", exchange.ClientSecret },
        { "subject_token", context.AccessToken },
        { "subject_token_type", "urn:ietf:params:oauth:token-type:access_token" },
        { "requested_token_type", "urn:ietf:params:oauth:token-type:access_token" }
      };

      var started = _timeProvider.GetUtcNow();
      var assertion = await exchange.KeycloakBaseUri
        .AppendPathSegments("realms", exchange.Realm, "protocol", "openid-connect", "token")
        .WithTimeout(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds))
        .PostUrlEncodedAsync(requestAssertion, cancellationToken: cancellationToken)
        .EnsureSuccessStatusCodeAsync()
        .ReceiveJson<AccessTokenResponse>();

      var assertionExpiry = ValidateResponse(assertion, started);
      var assertionClaims = ReadClaims(assertion.AccessToken);
      AssertClaim(assertionClaims, "sub", context.UserId);
      var audiences = GetAudiences(assertionClaims);
      if (audiences.Count != 1 || audiences[0] != _options.Holder.AssertionAudience)
        throw new InvalidOperationException("Yoma assertion must have exactly the configured didx:me audience");

      ArgumentException.ThrowIfNullOrWhiteSpace(_options.KeycloakBaseUri);
      ArgumentException.ThrowIfNullOrWhiteSpace(_options.Holder.Realm);

      var requestHolder = new Dictionary<string, string>
      {
        { "grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer" },
        { "client_id", _options.Holder.ClientId },
        { "client_secret", _options.Holder.ClientSecret },
        { "assertion", assertion.AccessToken }
      };

      var holderStarted = _timeProvider.GetUtcNow();
      var response = await _options.KeycloakBaseUri
        .AppendPathSegments("realms", _options.Holder.Realm, "protocol", "openid-connect", "token")
        .WithTimeout(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds))
        .PostUrlEncodedAsync(requestHolder, cancellationToken: cancellationToken)
        .EnsureSuccessStatusCodeAsync()
        .ReceiveJson<AccessTokenResponse>();

      var holderExpiry = ValidateResponse(response, holderStarted);
      var holderClaims = ReadClaims(response.AccessToken);
      AssertClaim(holderClaims, "sub", context.HolderId);
      AssertClaim(holderClaims, "tenantAlias", _options.TenantAlias);
      AssertClaim(holderClaims, "iss", _options.Holder.AssertionAudience);
      if (!GetAudiences(holderClaims).Contains("me-wallet-api"))
        throw new InvalidOperationException("didx:me holder token is missing the wallet audience");

      var expires = new[] { sourceExpiry, assertionExpiry, holderExpiry }.Min();
      if (expires <= _timeProvider.GetUtcNow())
        throw new InvalidOperationException("Federated holder token expired during acquisition");

      return new CachedToken
      {
        Key = key,
        HolderId = context.HolderId,
        Value = response.AccessToken,
        DateExpire = expires
      };
    }

    private DateTimeOffset ValidateResponse(AccessTokenResponse? response, DateTimeOffset started)
    {
      if (response == null || string.IsNullOrWhiteSpace(response.AccessToken) || response.ExpiresIn <= 0 ||
        !string.Equals(response.TokenType, "Bearer", StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("Invalid federation token response");

      var expiry = new[] { started.AddSeconds(response.ExpiresIn), GetExpiry(ReadClaims(response.AccessToken)) }.Min();
      expiry = expiry.AddSeconds(-Math.Min(_options.AccessTokenRefreshBufferSeconds, response.ExpiresIn / 10d));
      if (expiry <= _timeProvider.GetUtcNow())
        throw new InvalidOperationException("Federation token response has expired");

      return expiry;
    }

    private static JObject ReadClaims(string token)
    {
      try
      {
        var parts = token.Split('.');
        if (parts.Length != 3) throw new FormatException();
        var payload = parts[1].Replace('-', '+').Replace('_', '/');
        payload = payload.PadRight((payload.Length + 3) / 4 * 4, '=');
        return JObject.Parse(Encoding.UTF8.GetString(Convert.FromBase64String(payload)));
      }
      catch (Exception exception) when (exception is FormatException or Newtonsoft.Json.JsonException or ArgumentException)
      {
        // Do not include raw tokens or parser exceptions in the public failure.
        throw new InvalidOperationException("Invalid federation token claims");
      }
    }

    private static void AssertClaim(JObject claims, string name, string expected)
    {
      if (claims[name]?.Type != JTokenType.String || claims.Value<string>(name) != expected)
        throw new InvalidOperationException($"Federation token {name} does not match the expected identity context");
    }

    private static DateTimeOffset GetExpiry(JObject claims)
    {
      if (claims["exp"]?.Type != JTokenType.Integer)
        throw new InvalidOperationException("Federation token expiry is missing");

      return DateTimeOffset.FromUnixTimeSeconds(claims.Value<long>("exp"));
    }

    private static List<string> GetAudiences(JObject claims)
    {
      if (claims["aud"]?.Type == JTokenType.String) return [claims.Value<string>("aud")!];
      if (claims["aud"] is JArray values && values.All(value => value.Type == JTokenType.String))
        return values.Values<string>().Select(value => value!).ToList();
      throw new InvalidOperationException("Federation token audience is missing or malformed");
    }

    private sealed class CachedToken
    {
      public string Key { get; init; } = null!;

      public string HolderId { get; init; } = null!;

      public string Value { get; init; } = null!;

      public DateTimeOffset DateExpire { get; init; }
    }
    #endregion
  }
}
