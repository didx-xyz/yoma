using Newtonsoft.Json;

namespace Yoma.Core.Domain.SSI.Models
{
  /// <summary>
  /// Structured credential attribute item. Skills currently use the human-readable name only because Yoma
  /// does not yet have a taxonomy-independent skill identifier.
  /// </summary>
  public sealed class SSICredentialAttributeItem
  {
    [JsonProperty("name")]
    public string Name { get; set; } = null!;
  }
}
