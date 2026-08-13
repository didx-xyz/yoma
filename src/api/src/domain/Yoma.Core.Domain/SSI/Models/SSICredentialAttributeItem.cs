using Newtonsoft.Json;

namespace Yoma.Core.Domain.SSI.Models
{
  /// <summary>
  /// Structured credential attribute item containing the human-readable value signed into the credential.
  /// Skills and multi-select custom fields use this common representation; clients do not parse provider JSON.
  /// </summary>
  public sealed class SSICredentialAttributeItem
  {
    [JsonProperty("name")]
    public string Name { get; set; } = null!;
  }
}
