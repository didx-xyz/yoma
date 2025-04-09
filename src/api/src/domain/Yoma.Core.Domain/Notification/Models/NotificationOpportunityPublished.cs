using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public class NotificationOpportunityPublished : NotificationBase
  {
    [JsonProperty("opportunities")]
    public List<NotificationOpportunityPublishedItem> Opportunities { get; set; }

    public override Dictionary<string, string> ContentVariables(MessageType messageType)
    {
      if (messageType is not MessageType.SMS and not MessageType.WhatsApp)
        throw new NotSupportedException($"Only '{MessageType.SMS}' or '{MessageType.WhatsApp}' are supported");

      if (Opportunities == null || Opportunities.Count != 1)
        throw new InvalidOperationException("Exactly one opportunity is required to generate content variables");

      var opportunity = Opportunities.Single();
      var url = new Uri(opportunity.URL);
      var formattedUrl = messageType == MessageType.WhatsApp
        ? url.PathAndQuery.TrimStart('/')
        : url.ToString();

      return new Dictionary<string, string>
      {
        { "1", RecipientDisplayName },
        { "2", SubjectSuffix },
        { "3", formattedUrl }
      };
    }

    public override List<NotificationBase> FlattenItems()
    {
      if (Opportunities == null || Opportunities.Count == 0)
        throw new InvalidOperationException($"{nameof(Opportunities)} are not set or empty");

      return [.. Opportunities.Select(item => new NotificationOpportunityPublished
      {
        SubjectSuffix = SubjectSuffix,
        RecipientDisplayName = RecipientDisplayName,
        Opportunities = [item]
      })];
    }
  }

  public class NotificationOpportunityPublishedItem
  {
    [JsonIgnore]
    public Guid Id { get; set; }

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
