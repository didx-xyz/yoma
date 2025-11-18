using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public sealed class NotificationReferralUsageCompletion : NotificationBase
  {
    [JsonProperty("yoIDURL")]
    public string? YoIDURL { get; set; }

    [JsonProperty("dateCompleted")]
    public DateTimeOffset DateCompleted { get; set; }

    [JsonProperty("dateCompletedFormatted")]
    public string DateCompletedFormatted => DateCompleted.ToString("ddd, MMM dd, yyyy HH:mm");

    [JsonProperty("dateClaimed")]
    public DateTimeOffset DateClaimed { get; set; }

    [JsonProperty("dateClaimedFormatted")]
    public string DateClaimedFormatted => DateClaimed.ToString("ddd, MMM dd, yyyy HH:mm");

    [JsonProperty("programName")]
    public string ProgramName { get; set; } = null!;

    [JsonProperty("zltoReward")]
    public decimal? ZltoReward { get; set; }

    [JsonProperty("zltoRewardFormatted")]
    public string? ZltoRewardFormatted { get; set; }

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

    public override List<NotificationBase> FlattenItems() => [this];
  }
}
