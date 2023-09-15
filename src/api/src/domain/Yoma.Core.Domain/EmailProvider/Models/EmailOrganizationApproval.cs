using Newtonsoft.Json;

namespace Yoma.Core.Domain.EmailProvider.Models
{
    public class EmailOrganizationApproval : EmailBase
    {
        [JsonProperty("organizations")]
        public List<EmailOrganizationApprovalItem> Organizations { get; set; }
    }

    public class EmailOrganizationApprovalItem
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonIgnore]
        public string? Comment { get; set; }

        [JsonProperty("commentFormatted")]
        public string? CommentFormatted => !string.IsNullOrEmpty(Comment) ? Comment : "No additional information";

        [JsonProperty("url")]
        public string URL { get; set; }
    }

}
