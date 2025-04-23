using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public class NotificationOpportunityVerification : NotificationBase
  {
    [JsonProperty("yoIDURL")]
    public string? YoIDURL { get; set; }

    [JsonProperty("verificationURL")]
    public string? VerificationURL { get; set; }

    [JsonProperty("opportunities")]
    public List<NotificationOpportunityVerificationItem> Opportunities { get; set; }

    public override Dictionary<string, string> ContentVariables(MessageType messageType)
    {
      if (messageType is not MessageType.SMS and not MessageType.WhatsApp)
        throw new NotSupportedException($"Only '{MessageType.SMS}' or '{MessageType.WhatsApp}' are supported");

      if (string.IsNullOrWhiteSpace(YoIDURL))
        throw new InvalidOperationException("YoIDURL is not set");

      var url = new Uri(YoIDURL);
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
      if (Opportunities == null || Opportunities.Count == 0)
        throw new InvalidOperationException($"{nameof(Opportunities)} are not set or empty");

      return [.. Opportunities.Select(item => new NotificationOpportunityVerification
      {
        SubjectSuffix = SubjectSuffix,
        RecipientDisplayName = RecipientDisplayName,
        YoIDURL = YoIDURL,
        VerificationURL = VerificationURL,
        Opportunities = [item]
      })];
    }
  }

  public class NotificationOpportunityVerificationItem
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

    [JsonProperty("comment")]
    public string? Comment { get; set; }

    [JsonProperty("commentFormatted")]
    public string? CommentFormatted => !string.IsNullOrEmpty(Comment) ? Comment : "No additional information";

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
