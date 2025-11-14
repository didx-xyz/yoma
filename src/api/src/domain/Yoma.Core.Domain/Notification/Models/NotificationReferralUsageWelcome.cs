using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public sealed class NotificationReferralUsageWelcome : NotificationBase
  {
    [JsonProperty("yoIDURL")]
    public string? YoIDURL { get; set; }

    [JsonProperty("linkClaimURL")]
    public string? LinkClaimURL { get; set; }

    [JsonProperty("dateClaimed")]
    public DateTimeOffset DateClaimed { get; set; }

    [JsonProperty("dateClaimedFormatted")]
    public string DateClaimedFormatted => DateClaimed.ToString("ddd, MMM dd, yyyy HH:mm");

    [JsonProperty("programName")]
    public string ProgramName { get; set; } = null!;

    [JsonProperty("programDateStart")]
    public DateTimeOffset ProgramDateStart { get; set; }

    [JsonProperty("programDateStartFormatted")]
    public string ProgramDateStartFormatted => ProgramDateStart.ToString("ddd, MMM dd, yyyy HH:mm");

    [JsonProperty("programDateEnd")]
    public DateTimeOffset? ProgramDateEnd { get; set; }

    [JsonProperty("programDateEndFormatted")]
    public string ProgramDateEndFormatted => ProgramDateEnd.HasValue ? ProgramDateEnd.Value.ToString("ddd, MMM dd, yyyy HH:mm") : "No end date";

    [JsonProperty("completionWindowInDays")]
    public int? CompletionWindowInDays { get; set; }

    [JsonProperty("dateDeadline")]
    public DateTimeOffset? DateDeadline => CompletionWindowInDays.HasValue ? DateClaimed.AddDays(CompletionWindowInDays.Value) : null;

    [JsonProperty("dateDeadlineFormatted")]
    public string? DateDeadlineFormatted => DateDeadline.HasValue ? DateDeadline.Value.ToString("ddd, MMM dd, yyyy HH:mm") : null;

    [JsonProperty("zltoReward")]
    public decimal? ZltoReward { get; set; }

    [JsonProperty("zltoRewardFormatted")]
    public string? ZltoRewardFormatted => ZltoReward.HasValue ? ZltoReward.Value.ToString("0.00") : decimal.Zero.ToString("0.00");

    [JsonProperty("proofOfPersonhoodRequired")]
    public bool ProofOfPersonhoodRequired { get; set; }

    [JsonProperty("proofOfPersonhoodRequiredFormatted")]
    public string ProofOfPersonhoodRequiredFormatted => ProofOfPersonhoodRequired ? "Yes" : "No";

    [JsonProperty("pathwayRequired")]
    public bool PathwayRequired { get; set; }

    [JsonProperty("pathwayRequiredFormatted")]
    public string PathwayRequiredFormatted => PathwayRequired ? "Yes" : "No";

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
