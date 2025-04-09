using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public class NotificationActionLinkVerifyApproval : NotificationBase
  {
    [JsonProperty("links")]
    public List<NotificationActionLinkVerifyApprovalItem> Links { get; set; }

    public override List<NotificationBase> FlattenItems()
    {
      if (Links == null || Links.Count == 0)
        throw new InvalidOperationException($"{nameof(Links)} are not set or empty");

      return [.. Links.Select(item => new NotificationActionLinkVerifyApproval
      {
        SubjectSuffix = SubjectSuffix,
        RecipientDisplayName = RecipientDisplayName,
        Links = [item]
      })];
    }
  }

  public class NotificationActionLinkVerifyApprovalItem
  {
    [JsonProperty("name")]
    public string Name { get; set; }

    [JsonProperty("entityType")]
    public string EntityType { get; set; }

    [JsonProperty("comment")]
    public string? Comment { get; set; }

    [JsonProperty("commentFormatted")]
    public string? CommentFormatted => !string.IsNullOrEmpty(Comment) ? Comment : "No additional information";

    [JsonProperty("url")]
    public string URL { get; set; }
  }
}
