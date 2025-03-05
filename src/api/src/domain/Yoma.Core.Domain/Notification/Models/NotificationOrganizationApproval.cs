using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public class NotificationOrganizationApproval : NotificationBase
  {
    [JsonProperty("organizations")]
    public List<NotificationOrganizationApprovalItem> Organizations { get; set; }
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
