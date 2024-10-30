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

    [JsonIgnore]
    public override Dictionary<string, string> ContentVariables => new()
    {
      { "1", SubjectSuffix },
      { "2", RecipientDisplayName }
    };
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
