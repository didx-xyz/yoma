using Newtonsoft.Json;

namespace Yoma.Core.Domain.EmailProvider.Models
{
  public class EmailActionLinkVerifyApproval : EmailBase
  {
    [JsonProperty("links")]
    public List<EmailActionLinkVerifyApprovalItem> Links { get; set; }
  }

  public class EmailActionLinkVerifyApprovalItem
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
