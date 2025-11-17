using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public sealed class NotificationReferralBlock : NotificationBase
  {
    [JsonProperty("dateStamp")]
    public DateTimeOffset DateStamp { get; set; }

    [JsonProperty("dateStampFormatted")]
    public string DateStampFormatted => DateStamp.ToString("ddd, MMM dd, yyyy HH:mm");

    [JsonProperty("reason")]
    public string? Reason { get; set; }

    [JsonProperty("reasonFormatted")]
    public string? ReasonFormatted => !string.IsNullOrEmpty(Reason) ? Reason : "No reason specified";

    [JsonProperty("comment")]
    public string? Comment { get; set; }

    [JsonProperty("commentFormatted")]
    public string? CommentFormatted => !string.IsNullOrEmpty(Comment) ? Comment : "No additional information";

    public override Dictionary<string, string> ContentVariables(MessageType messageType)
    {
      if (messageType is not MessageType.SMS and not MessageType.WhatsApp)
        throw new NotSupportedException($"Only '{MessageType.SMS}' or '{MessageType.WhatsApp}' are supported");

      return new Dictionary<string, string>
      {
        { "1", SubjectSuffix }
      };
    }

    public override List<NotificationBase> FlattenItems() => [this];
  }
}
