using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public abstract class NotificationBase
  {
    [JsonProperty("subjectSuffix")]
    public string SubjectSuffix { get; set; }

    [JsonProperty("recipientDisplayName")]
    public string RecipientDisplayName { get; set; }
  }
}
