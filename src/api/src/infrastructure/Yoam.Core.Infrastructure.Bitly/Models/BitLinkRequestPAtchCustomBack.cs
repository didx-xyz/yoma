using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.Bitly.Models
{
  public class BitLinkRequestPAtchCustomBack
  {
    [JsonProperty("bitlink_id")]
    public string Id { get; set; } = null!;

    [JsonProperty("custom_bitlink")]
    public string CustomLink { get; set; } = null!;
  }
}
