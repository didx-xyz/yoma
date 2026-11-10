using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;
using System.Net;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Infrastructure.DidxMe.Interfaces;
using Yoma.Core.Infrastructure.DidxMe.Models;

namespace Yoma.Core.Infrastructure.DidxMe.Client
{
  /// <summary>
  /// Calls issuer, onboarding and organisation-delivery APIs using Yoma's shared Flurl helpers
  /// and host-configured Newtonsoft serializer. Expected absence and conflicts are handled at
  /// their call sites; unauthorized responses invalidate the issuer token without retrying mutations.
  /// </summary>
  public class IssuerClient : IIssuerClient
  {
    #region Class Variables
    private readonly ProviderOptions _options;
    private readonly IIssuerAuthService _authService;
    #endregion

    #region Constructor
    public IssuerClient(
      IOptions<ProviderOptions> options,
      IIssuerAuthService authService)
    {
      ArgumentNullException.ThrowIfNull(options, nameof(options));

      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
      _authService = authService ?? throw new ArgumentNullException(nameof(authService));
    }
    #endregion

    #region Public Members
    /// <summary>
    /// Creates an immutable preset, or returns null on the expected conflict so the caller can
    /// retrieve and validate the existing definition. A conflict does not raise an HTTP exception.
    /// </summary>
    public async Task<CredentialPreset?> CreatePresetOrNull(
      string code,
      string name,
      Dictionary<string, CredentialAttribute> attributes)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(_options.CredentialsBaseUri);

      var requestCreate = new CredentialPresetRequestCreate
      {
        Code = code,
        TemplateName = name,
        TemplateDescription = $"Yoma credential preset: {name}",
        TemplateAttributes = attributes
      };

      var authHeader = await _authService.GetAuthHeader();
      using var response = await Execute(() => _options.CredentialsBaseUri
        .AppendPathSegments("v1", "presets", "credentials")
        .WithAuthHeader(authHeader)
        .WithTimeout(TimeSpan.FromSeconds(_options.IssuerRequestTimeoutSeconds))
        .AllowHttpStatus((int)HttpStatusCode.Conflict)
        .PostJsonAsync(requestCreate),
        [HttpStatusCode.Created, HttpStatusCode.Conflict]);

      if ((HttpStatusCode)response.StatusCode == HttpStatusCode.Conflict) return null;

      var result = await response.GetJsonAsync<ApiResponse<CredentialPreset>>();
      return result?.Data ?? throw new InvalidOperationException("didx:me preset response is missing data");
    }

    public async Task<CredentialPreset> GetPreset(string id)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(_options.CredentialsBaseUri);

      var authHeader = await _authService.GetAuthHeader();
      using var response = await Execute(() => _options.CredentialsBaseUri
        .AppendPathSegments("v1", "presets", "credentials", id)
        .WithAuthHeader(authHeader)
        .WithTimeout(TimeSpan.FromSeconds(_options.IssuerRequestTimeoutSeconds))
        .GetAsync());

      var result = await response.GetJsonAsync<ApiResponse<CredentialPreset>>();
      return result?.Data ?? throw new InvalidOperationException("didx:me preset response is missing data");
    }

    /// <summary>
    /// References the preset only; didx:me owns materialization and reuse of its managed template.
    /// </summary>
    public async Task<IssuanceResponse> Issue(string presetId, Dictionary<string, string> attributes)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(_options.CredentialsBaseUri);

      var requestCreate = new IssuanceRequestCreate
      {
        Credentials =
        [
          new IssuanceCredentialRequest
          {
            Reference = $"presetId:{presetId}",
            Attributes = attributes
          }
        ]
      };

      var authHeader = await _authService.GetAuthHeader();
      using var response = await Execute(() => _options.CredentialsBaseUri
        .AppendPathSegments("v1", "issuances")
        .WithAuthHeader(authHeader)
        .WithTimeout(TimeSpan.FromSeconds(_options.IssuerRequestTimeoutSeconds))
        .PostJsonAsync(requestCreate),
        [HttpStatusCode.Created]);

      var result = await response.GetJsonAsync<ApiResponse<IssuanceResponse>>();
      return result?.Data ?? throw new InvalidOperationException("didx:me issuance response is missing data");
    }

    public async Task<IssuanceResponse> GetIssuance(string id)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(id);
      ArgumentException.ThrowIfNullOrWhiteSpace(_options.CredentialsBaseUri);

      var authHeader = await _authService.GetAuthHeader();
      using var response = await Execute(() => _options.CredentialsBaseUri
        .AppendPathSegments("v1", "issuances", id)
        .WithAuthHeader(authHeader)
        .WithTimeout(TimeSpan.FromSeconds(_options.IssuerRequestTimeoutSeconds))
        .GetAsync());

      var result = await response.GetJsonAsync<ApiResponse<IssuanceResponse>>();
      return result?.Data ?? throw new InvalidOperationException("didx:me issuance response is missing data");
    }

    /// <summary>
    /// Pushes the offer to the holder wallet with synchronous auto-approval. A successful response
    /// has data:null and confirms delivery, but supplies neither a wallet ID nor background access.
    /// The recipient is the verified Yoma external identifier; this endpoint cannot take a holder ID.
    /// </summary>
    public async Task Deliver(string externalId, string offerUri)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(_options.WalletBaseUri);

      var requestDeliver = new CredentialDeliveryRequest
      {
        Recipient = externalId,
        CredentialOffer = offerUri
      };

      var authHeader = await _authService.GetAuthHeader();
      using var response = await Execute(() => _options.WalletBaseUri
        .AppendPathSegments("v2", "orgs", "credentials")
        .WithAuthHeader(authHeader)
        .WithHeader("x-approve-credential", "true")
        .WithTimeout(TimeSpan.FromSeconds(_options.IssuerRequestTimeoutSeconds))
        .PostJsonAsync(requestDeliver),
        [HttpStatusCode.Created]);

      _ = await response.GetJsonAsync<ApiResponse<JToken>>()
        ?? throw new InvalidOperationException("didx:me delivery response is missing");
    }

    /// <summary>
    /// Resolves the Yoma Keycloak subject through the tenant-scoped external identifier mapping.
    /// The returned Id is the actual didx:me holder identity, distinct from the lookup argument.
    /// </summary>
    public async Task<Holder?> GetHolderOrNull(string externalId)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(_options.OnboardingBaseUri);

      var authHeader = await _authService.GetAuthHeader();
      using var response = await Execute(() => _options.OnboardingBaseUri
        .AppendPathSegments("users", "by-external-identifier", externalId)
        .WithAuthHeader(authHeader)
        .WithTimeout(TimeSpan.FromSeconds(_options.IssuerRequestTimeoutSeconds))
        .AllowHttpStatus((int)HttpStatusCode.NotFound)
        .GetAsync(),
        [HttpStatusCode.NotFound]);

      if ((HttpStatusCode)response.StatusCode == HttpStatusCode.NotFound) return null;

      var result = await response.GetJsonAsync<ApiResponse<Holder>>();
      var holder = result?.Data ?? throw new InvalidOperationException("didx:me holder response is missing data");
      if (!Guid.TryParse(holder.Id, out _) || string.IsNullOrWhiteSpace(holder.Username) || !holder.Enabled)
        throw new InvalidOperationException("The linked didx:me holder is incomplete or disabled");

      return holder;
    }

    public async Task CreateHolder(string externalId, string username, string? firstName, string? lastName)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(_options.OnboardingBaseUri);

      // Federation uses the external subject. Do not send invitations or expose generated credentials.
      var requestCreate = new HolderRequestCreate
      {
        Username = username,
        FirstName = firstName,
        LastName = lastName,
        ExternalIdentifier = externalId,
        SendOnboardingEmail = false
      };

      var authHeader = await _authService.GetAuthHeader();
      using var response = await Execute(() => _options.OnboardingBaseUri
        .AppendPathSegment("users")
        .WithAuthHeader(authHeader)
        .WithTimeout(TimeSpan.FromSeconds(_options.IssuerRequestTimeoutSeconds))
        .PostJsonAsync(requestCreate),
        [HttpStatusCode.Created]);

      _ = await response.GetJsonAsync<ApiResponse<JToken>>()
        ?? throw new InvalidOperationException("didx:me onboarding response is missing");
    }

    public async Task EnableHolderLink(string username)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(_options.OnboardingBaseUri);

      var requestUpdate = new HolderLinkRequest
      {
        Enabled = true
      };

      var authHeader = await _authService.GetAuthHeader();
      using var response = await Execute(() => _options.OnboardingBaseUri
        .AppendPathSegments("users", username, "idp-link")
        .WithAuthHeader(authHeader)
        .WithTimeout(TimeSpan.FromSeconds(_options.IssuerRequestTimeoutSeconds))
        .PatchJsonAsync(requestUpdate));

      var result = await response.GetJsonAsync<ApiResponse<HolderLinkResponse>>();
      if (result?.Data == null || !result.Data.Linked || result.Data.Username != username)
        throw new InvalidOperationException("didx:me did not confirm the requested holder federation link");
    }
    #endregion

    #region Private Members
    private async Task<IFlurlResponse> Execute(
      Func<Task<IFlurlResponse>> request,
      List<HttpStatusCode>? additionalSuccessStatusCodes = null)
    {
      try
      {
        return await request().EnsureSuccessStatusCodeAsync(additionalSuccessStatusCodes);
      }
      catch (HttpClientException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
      {
        _authService.Invalidate();
        // Mutations must not be silently repeated after an uncertain outcome.
        throw;
      }
    }
    #endregion
  }
}
