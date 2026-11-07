using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  public class CredentialAttribute
  {
    [JsonProperty("type")]
    public string Type { get; set; } = "string";

    [JsonProperty("name")]
    public string Name { get; set; } = null!;

    [JsonProperty("required")]
    public bool Required { get; set; }

    [JsonProperty("alwaysDisclosed")]
    public bool AlwaysDisclosed { get; set; }
  }
}
