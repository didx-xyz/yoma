using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Infrastructure.DidxMe.Interfaces;
using Yoma.Core.Infrastructure.DidxMe.Models;

namespace Yoma.Core.Infrastructure.DidxMe.Client
{
  /// <summary>
  /// Reads participant credentials using Yoma's shared Flurl authentication/status helpers.
  /// HTTP failures propagate as HttpClientException; a failed page is never treated as empty.
  /// Unauthorized responses invalidate the rejected holder token in the shared cache, without retry.
  /// </summary>
  public class WalletClient
  {
    #region Class Variables
    private readonly ProviderOptions _options;
    private readonly IHolderAuthService _authService;

    // Signed claim strings must stay byte-for-byte equivalent, including ISO-looking dates.
    // Apply this only when parsing wallet responses; leave Yoma's Flurl serializer defaults alone.
    private static readonly JsonSerializerSettings SerializerSettings = new()
    {
      DateParseHandling = DateParseHandling.None
    };
    #endregion

    #region Constructor
    public WalletClient(
      IOptions<ProviderOptions> options,
      IHolderAuthService authService)
    {
      ArgumentNullException.ThrowIfNull(options, nameof(options));

      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
      _authService = authService ?? throw new ArgumentNullException(nameof(authService));
    }
    #endregion

    #region Public Members
    public async Task<WalletCredential> GetCredential(
      HolderContext context,
      string id,
      CancellationToken cancellationToken = default)
    {
      if (!Guid.TryParse(id, out var credentialId))
        throw new ArgumentException("A valid wallet credential ID is required", nameof(id));

      ArgumentException.ThrowIfNullOrWhiteSpace(_options.WalletBaseUri);

      var authHeader = await _authService.GetAuthHeader(context, cancellationToken);
      using var response = await Execute(() => _options.WalletBaseUri
        .AppendPathSegments("v2", "credentials", credentialId.ToString())
        .WithAuthHeader(authHeader)
        .WithTimeout(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds))
        .GetAsync(cancellationToken: cancellationToken));

      var json = await response.GetStringAsync();
      var result = JsonConvert.DeserializeObject<ApiResponse<WalletCredential>>(json, SerializerSettings)
        ?? throw new InvalidOperationException("Wallet response is missing");
      ValidateCredential(result.Data);

      if (!string.Equals(result.Data!.Id, credentialId.ToString(), StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("Wallet response credential ID differs from the requested ID");

      return result.Data;
    }

    /// <summary>
    /// Returns one explicit page of accepted credentials. Consumers must process pagination;
    /// never treat a first page or a failed request as proof that a credential is absent.
    /// </summary>
    public async Task<ApiResponse<List<WalletCredential>>> ListCredentialPage(
      HolderContext context,
      string? after = null,
      int pageSize = 100,
      CancellationToken cancellationToken = default)
    {
      if (pageSize < 1 || pageSize > 100)
        throw new ArgumentOutOfRangeException(nameof(pageSize));

      ArgumentException.ThrowIfNullOrWhiteSpace(_options.WalletBaseUri);

      var url = _options.WalletBaseUri
        .AppendPathSegments("v2", "credentials")
        .SetQueryParams(new Dictionary<string, object>
        {
          ["status"] = "accepted",
          ["page[size]"] = pageSize
        });

      if (!string.IsNullOrWhiteSpace(after)) url.SetQueryParam("page[after]", after);

      var authHeader = await _authService.GetAuthHeader(context, cancellationToken);
      using var response = await Execute(() => url
        .WithAuthHeader(authHeader)
        .WithTimeout(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds))
        .GetAsync(cancellationToken: cancellationToken));

      var json = await response.GetStringAsync();
      var result = JsonConvert.DeserializeObject<ApiResponse<List<WalletCredential>>>(json, SerializerSettings)
        ?? throw new InvalidOperationException("Wallet response is missing");

      if (result.Data == null)
        throw new InvalidOperationException("Wallet response is missing credential data");

      foreach (var credential in result.Data)
        ValidateCredential(credential);

      return result;
    }
    #endregion

    #region Private Members
    private async Task<IFlurlResponse> Execute(Func<Task<IFlurlResponse>> request)
    {
      try
      {
        return await request().EnsureSuccessStatusCodeAsync();
      }
      catch (HttpClientException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
      {
        await _authService.Invalidate();
        // Propagate the failed operation. No hidden retries or issuer-token substitution.
        throw;
      }
    }

    private static void ValidateCredential(WalletCredential? credential)
    {
      if (credential == null || !Guid.TryParse(credential.Id, out _) || credential.Claims == null ||
        credential.DateIssued == null || string.IsNullOrWhiteSpace(credential.Vct) ||
        string.IsNullOrWhiteSpace(credential.Status))
        throw new InvalidOperationException("Wallet credential response is incomplete");

      if (credential.Format != "vc+sd-jwt")
        throw new NotSupportedException("Only SD-JWT wallet credentials are supported by this adapter");
    }
    #endregion
  }
}
