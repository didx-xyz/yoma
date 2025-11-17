using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public sealed class NotificationReferralLinkCompleted : NotificationBase
  {
    [JsonProperty("dashboardURL")] //yoid/referrals
    public string? DashboardURL { get; set; }

    [JsonProperty("links")]
    public List<NotificationReferralLinkCompletedItem> Links { get; set; } = null!;

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

    public override List<NotificationBase> FlattenItems()
    {
      if (Links == null || Links.Count == 0)
        throw new InvalidOperationException($"{nameof(Links)} are not set or empty");

      return [.. Links.Select(item => new NotificationReferralLinkCompleted
      {
        SubjectSuffix = SubjectSuffix,
        RecipientDisplayName = RecipientDisplayName,
        DashboardURL = DashboardURL,
        Links = [item]
      })];
    }
  }

  public sealed class NotificationReferralLinkCompletedItem
  {
    [JsonProperty("name")]
    public string Name { get; set; } = null!;

    [JsonProperty("programName")]
    public string ProgramName { get; set; } = null!;

    [JsonProperty("dateCompleted")]
    public DateTimeOffset DateCompleted { get; set; }

    [JsonProperty("dateCompletedFormatted")]
    public string DateCompletedFormatted => DateCompleted.ToString("ddd, MMM dd, yyyy HH:mm");

    [JsonProperty("zltoReward")]
    public decimal? ZltoReward { get; set; }

    [JsonProperty("zltoRewardFormatted")]
    public string? ZltoRewardFormatted => ZltoReward.HasValue ? ZltoReward.Value.ToString("0.00") : decimal.Zero.ToString("0.00");

    [JsonProperty("zltoRewardTotal")]
    public decimal? ZltoRewardTotal { get; set; }

    [JsonProperty("zltoRewardTotalFormatted")]
    public string? ZltoRewardTotalFormatted => ZltoRewardTotal.HasValue ? ZltoRewardTotal.Value.ToString("0.00") : decimal.Zero.ToString("0.00");

    [JsonProperty("completionTotal")]
    public int completionTotal { get; set; }
  }
}
