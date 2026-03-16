using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public sealed class NotificationReferralUsageCompletion : NotificationBase
  {
    [JsonProperty("dashboardURL")]
    public string? DashboardURL { get; set; }

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
    public string? ZltoRewardFormatted => ZltoReward.HasValue ? ZltoReward.Value.ToString("0.00") : decimal.Zero.ToString("0.00");

    public override Dictionary<string, string> ContentVariables(MessageType messageType)
    {
      if (messageType is not MessageType.SMS and not MessageType.WhatsApp)
        throw new NotSupportedException($"Only '{MessageType.SMS}' or '{MessageType.WhatsApp}' are supported");

      if (string.IsNullOrWhiteSpace(DashboardURL))
        throw new InvalidOperationException("DashboardURL is not set");

      var url = new Uri(DashboardURL);
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
