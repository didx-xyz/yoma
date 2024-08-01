using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.SAYouth.Models
{
  internal class OpportunityResponse
  {
    [JsonProperty("success")]
    public bool Success { get; set; }

    [JsonProperty("response")]
    public OpportunityDetails? Details { get; set; }

    [JsonProperty("errors")]
    public List<string>? Errors { get; set; }
  }

  public class OpportunityDetails
  {
    [JsonProperty("opportunityId")]
    public int OpportunityId { get; set; }
  }
}
