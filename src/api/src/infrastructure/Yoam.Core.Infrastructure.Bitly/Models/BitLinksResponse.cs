using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.Bitly.Models
{
  public class BitLinksResponse
  {
    [JsonProperty("link")]
    public string Link { get; set; }

    [JsonProperty("id")]
    public string Id { get; set; }

    [JsonProperty("long_url")]
    public string LongURL { get; set; }

    [JsonProperty("title")]
    public string Title { get; set; }

    [JsonProperty("archived")]
    public bool Archived { get; set; }

    [JsonProperty("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonProperty("created_by")]
    public string CreatedBy { get; set; }

    [JsonProperty("client_id")]
    public string ClientId { get; set; }

    [JsonProperty("custom_bitlinks")]
    public string[] CustomBitLinks { get; set; }

    [JsonProperty("tags")]
    public string[] Tags { get; set; }
  }
}
