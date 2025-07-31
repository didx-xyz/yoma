using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public class NotificationActionLinkVerifyActivated : NotificationBase
  {
    [JsonProperty("links")]
    public List<NotificationActionLinkVerifyActivatedItem> Links { get; set; }

    public override List<NotificationBase> FlattenItems()
    {
      if (Links == null || Links.Count == 0)
        throw new InvalidOperationException($"{nameof(Links)} are not set or empty");

      return [.. Links.Select(item => new NotificationActionLinkVerifyActivated
      {
        SubjectSuffix = SubjectSuffix,
        RecipientDisplayName = RecipientDisplayName,
        Links = [item]
      })];
    }
  }

  public class NotificationActionLinkVerifyActivatedItem
  {
    [JsonProperty("name")]
    public string Name { get; set; }

    [JsonProperty("entityType")]
    public string EntityType { get; set; }

    [JsonProperty("url")]
    public string URL { get; set; }
  }
}
