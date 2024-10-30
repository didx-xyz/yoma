using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public class NotificationActionLinkVerify : NotificationBase
  {
    [JsonProperty("entityTypeDesc")]
    public string EntityTypeDesc { get; set; }

    [JsonProperty("yoIDURL")]
    public string? YoIDURL { get; set; }

    [JsonProperty("items")]
    public List<NotificationActionLinkVerifyItem> Items { get; set; }
  }

  public class NotificationActionLinkVerifyItem
  {
    [JsonProperty("title")]
    public string Title { get; set; }

    [JsonProperty("dateStart")]
    public DateTimeOffset? DateStart { get; set; }

    [JsonProperty("dateStartFormatted")]
    public string DateStartFormatted => DateStart.HasValue ? DateStart.Value.ToString("ddd, MMM dd, yyyy HH:mm") : "No start date";

    [JsonProperty("dateEnd")]
    public DateTimeOffset? DateEnd { get; set; }

    [JsonProperty("dateEndFormatted")]
    public string DateEndFormatted => DateEnd.HasValue ? DateEnd.Value.ToString("ddd, MMM dd, yyyy HH:mm") : "No end date";

    [JsonProperty("url")]
    public string URL { get; set; }

    [JsonProperty("zltoReward")]
    public decimal? ZltoReward { get; set; }

    [JsonProperty("zltoRewardFormatted")]
    public string? ZltoRewardFormatted => ZltoReward.HasValue ? ZltoReward.Value.ToString("0.00") : decimal.Zero.ToString("0.00");

    [JsonProperty("yomaReward")]
    public decimal? YomaReward { get; set; }

    [JsonProperty("yomaRewardFormatted")]
    public string? YomaRewardFormatted => YomaReward.HasValue ? YomaReward.Value.ToString("0.00") : decimal.Zero.ToString("0.00");
  }
}
