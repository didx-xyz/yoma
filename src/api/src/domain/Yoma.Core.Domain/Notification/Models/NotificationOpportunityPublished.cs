using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public class NotificationOpportunityPublished : NotificationBase
  {
    [JsonIgnore]
    public string? URLOpportunitiesPublic { get; set; }

    [JsonProperty("opportunities")]
    public List<NotificationOpportunityPublishedItem> Opportunities { get; set; } = null!;

    public override Dictionary<string, string> ContentVariables(MessageType messageType)
    {
      if (messageType is not MessageType.SMS and not MessageType.WhatsApp)
        throw new NotSupportedException($"Only '{MessageType.SMS}' or '{MessageType.WhatsApp}' are supported");

      //if (Opportunities == null || Opportunities.Count != 1)
      //  throw new InvalidOperationException("Exactly one opportunity is required to generate content variables");

      if (string.IsNullOrWhiteSpace(URLOpportunitiesPublic))
        throw new InvalidOperationException($"{nameof(URLOpportunitiesPublic)} is not set");

      var url = new Uri(URLOpportunitiesPublic.Trim());
      var formattedUrl = messageType == MessageType.WhatsApp
        ? url.PathAndQuery.TrimStart('/')
        : url.ToString();

      return new Dictionary<string, string>
      {
        { "1", SubjectSuffix },
        { "2", formattedUrl }
      };
    }

    public override List<NotificationBase> FlattenItems()
    {
      return [this]; //send signle message pointing to '/opportunities?countries={country}' filtered by the user country if specified

      //if (Opportunities == null || Opportunities.Count == 0)
      //  throw new InvalidOperationException($"{nameof(Opportunities)} are not set or empty");

      //return [.. Opportunities.Select(item => new NotificationOpportunityPublished
      //{
      //  SubjectSuffix = SubjectSuffix,
      //  RecipientDisplayName = RecipientDisplayName,
      //  Opportunities = [item]
      //})];
    }
  }

  public class NotificationOpportunityPublishedItem
  {
    [JsonIgnore]
    public Guid Id { get; set; }

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
