using Newtonsoft.Json;

namespace Yoma.Core.Domain.EmailProvider.Models
{
  public abstract class EmailBase
  {
    [JsonProperty("subjectSuffix")]
    public string SubjectSuffix { get; set; }

    [JsonProperty("recipientDisplayName")]
    public string RecipientDisplayName { get; set; }
  }
}
