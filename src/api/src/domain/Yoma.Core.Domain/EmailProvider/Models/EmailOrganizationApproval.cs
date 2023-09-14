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

        [JsonProperty("comment")]
        public string? Comment { get; set; }

        [JsonProperty("url")]
        public string URL { get; set; }
    }

}
