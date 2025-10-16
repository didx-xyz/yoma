using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public abstract class NotificationBase
  {
    [JsonProperty("subjectSuffix")]
    public string SubjectSuffix { get; set; } = null!;

    [JsonProperty("recipientDisplayName")]
    public string RecipientDisplayName { get; set; } = null!;

    public virtual Dictionary<string, string> ContentVariables(MessageType messageType)
    {
      throw new NotImplementedException();
    }

    public abstract List<NotificationBase> FlattenItems();
  }
}
