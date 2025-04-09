using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public class NotificationOrganizationApproval : NotificationBase
  {
    [JsonProperty("organizations")]
    public List<NotificationOrganizationApprovalItem> Organizations { get; set; }

    public override List<NotificationBase> FlattenItems()
    {
      if (Organizations == null || Organizations.Count == 0)
        throw new InvalidOperationException($"{nameof(Organizations)} are not set or empty");

      return [.. Organizations.Select(item => new NotificationOrganizationApproval
      {
        SubjectSuffix = SubjectSuffix,
        RecipientDisplayName = RecipientDisplayName,
        Organizations = [item]
      })];
    }
  }

  public class NotificationOrganizationApprovalItem
  {
    [JsonProperty("name")]
    public string Name { get; set; }

    [JsonProperty("comment")]
    public string? Comment { get; set; }

    [JsonProperty("commentFormatted")]
    public string? CommentFormatted => !string.IsNullOrEmpty(Comment) ? Comment : "No additional information";

    [JsonProperty("url")]
    public string URL { get; set; }
  }
}
