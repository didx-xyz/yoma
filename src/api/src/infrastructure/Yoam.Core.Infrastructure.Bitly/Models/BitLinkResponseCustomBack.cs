using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.Bitly.Models
{
  public class BitLinkResponseCustomBack
  {
    [JsonProperty("custom_bitlink")]
    public string CustomBitLink { get; set; }

    [JsonProperty("bitlink")]
    public BitLinkResponse BitLink { get; set; }
  }
}
