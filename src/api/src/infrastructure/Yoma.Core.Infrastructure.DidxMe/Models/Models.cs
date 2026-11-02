using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  #region Presets
  internal sealed class CredentialPresetRequestCreate
  {
    [JsonProperty("credentialFormat")]
    public string CredentialFormat { get; set; } = "sd-jwt";

    [JsonProperty("code")]
    public string Code { get; set; } = null!;

    [JsonProperty("templateName")]
    public string TemplateName { get; set; } = null!;

    [JsonProperty("templateDescription")]
    public string TemplateDescription { get; set; } = null!;

    [JsonProperty("templateAttributes")]
    public Dictionary<string, CredentialAttribute> TemplateAttributes { get; set; } = [];

    [JsonProperty("namespace")]
    public string Namespace { get; set; } = "private";
  }
  #endregion

  #region Issuance
  internal sealed class IssuanceRequestCreate
  {
    [JsonProperty("credentials")]
    public List<IssuanceCredentialRequest> Credentials { get; set; } = [];
  }

  internal sealed class IssuanceCredentialRequest
  {
    [JsonProperty("reference")]
    public string Reference { get; set; } = null!;

    [JsonProperty("attributes")]
    public Dictionary<string, string> Attributes { get; set; } = [];
  }

  internal sealed class CredentialDeliveryRequest
  {
    [JsonProperty("recipient")]
    public string Recipient { get; set; } = null!;

    [JsonProperty("identifierType")]
    public string IdentifierType { get; set; } = "externalIdentifier";

    [JsonProperty("credentialOffer")]
    public string CredentialOffer { get; set; } = null!;
  }
  #endregion

  #region Holders
  /// <summary>
  /// Onboards a federated holder without email invitations or a separate password login.
  /// Optional names must be omitted rather than sent as null, as required by the onboarding API.
  /// </summary>
  internal sealed class HolderRequestCreate
  {
    [JsonProperty("username")]
    public string Username { get; set; } = null!;

    [JsonProperty("firstName", NullValueHandling = NullValueHandling.Ignore)]
    public string? FirstName { get; set; }

    [JsonProperty("lastName", NullValueHandling = NullValueHandling.Ignore)]
    public string? LastName { get; set; }

    [JsonProperty("externalIdentifier")]
    public string ExternalIdentifier { get; set; } = null!;

    [JsonProperty("sendOnboardingEmail")]
    public bool SendOnboardingEmail { get; set; }
  }

  internal sealed class HolderLinkRequest
  {
    [JsonProperty("enabled")]
    public bool Enabled { get; set; }
  }

  internal sealed class HolderLinkResponse
  {
    public string Username { get; set; } = null!;

    public bool Linked { get; set; }
  }
  #endregion
}
