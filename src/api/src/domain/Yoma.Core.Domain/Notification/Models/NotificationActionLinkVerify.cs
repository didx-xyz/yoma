using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public class NotificationActionLinkVerify : NotificationBase
  {
    [JsonProperty("entityTypeDesc")]
    public string EntityTypeDesc { get; set; } = null!;

    [JsonProperty("yoIDURL")]
    public string? YoIDURL { get; set; }

    [JsonProperty("items")]
    public List<NotificationActionLinkVerifyItem> Items { get; set; } = null!;

    public override Dictionary<string, string> ContentVariables(MessageType messageType)
    {
      if (messageType != MessageType.SMS && messageType != MessageType.WhatsApp)
        throw new ArgumentOutOfRangeException(nameof(messageType), $"Only {MessageType.SMS} or {MessageType.WhatsApp} are supported");

      if (Items == null || Items.Count == 0)
        throw new InvalidOperationException($"{nameof(Items)} are not set or empty");

      var url = Items.Single().URL;
      var urlFormatted = messageType == MessageType.WhatsApp
        ? new Uri(url).PathAndQuery.TrimStart('/')
        : url;

      return new Dictionary<string, string>
      {
        { "1", SubjectSuffix },
        { "2", EntityTypeDesc },
        { "3", urlFormatted }
      };
    }

    public override List<NotificationBase> FlattenItems()
    {
      if (Items == null || Items.Count == 0)
        throw new InvalidOperationException($"{nameof(Items)} are not set or empty");

      return [.. Items.Select(item => new NotificationActionLinkVerify
      {
        SubjectSuffix = SubjectSuffix,
        RecipientDisplayName = RecipientDisplayName,
        EntityTypeDesc = EntityTypeDesc,
        YoIDURL = YoIDURL,
        Items = [item]
      })];
    }
  }

  public class NotificationActionLinkVerifyItem
  {
    [JsonProperty("title")]
    public string Title { get; set; } = null!;

    [JsonProperty("dateStart")]
    public DateTimeOffset? DateStart { get; set; }

    [JsonProperty("dateStartFormatted")]
    public string DateStartFormatted => DateStart.HasValue ? DateStart.Value.ToString("ddd, MMM dd, yyyy HH:mm") : "No start date";

    [JsonProperty("dateEnd")]
    public DateTimeOffset? DateEnd { get; set; }

    [JsonProperty("dateEndFormatted")]
    public string DateEndFormatted => DateEnd.HasValue ? DateEnd.Value.ToString("ddd, MMM dd, yyyy HH:mm") : "No end date";

    [JsonProperty("url")]
    public string URL { get; set; } = null!;

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
