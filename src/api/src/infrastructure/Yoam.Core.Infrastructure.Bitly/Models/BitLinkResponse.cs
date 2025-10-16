using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.Bitly.Models
{
  public class BitLinkResponse
  {
    [JsonProperty("link")]
    public string Link { get; set; } = null!;

    [JsonProperty("id")]
    public string Id { get; set; } = null!;

    [JsonProperty("long_url")]
    public string LongURL { get; set; } = null!;

    [JsonProperty("title")]
    public string Title { get; set; } = null!;

    [JsonProperty("archived")]
    public bool Archived { get; set; }

    [JsonProperty("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonProperty("created_by")]
    public string CreatedBy { get; set; } = null!;

    [JsonProperty("client_id")]
    public string ClientId { get; set; } = null!;

    [JsonProperty("custom_bitlinks")]
    public string[] CustomBitLinks { get; set; } = null!;

    [JsonProperty("tags")]
    public string[] Tags { get; set; } = null!;

    [JsonProperty("launchpad_ids")]
    public string[] LaunchpadIds { get; set; } = null!;

    [JsonProperty("campaign_ids")]
    public string[] CampaignIds { get; set; } = null!;
  }
}
