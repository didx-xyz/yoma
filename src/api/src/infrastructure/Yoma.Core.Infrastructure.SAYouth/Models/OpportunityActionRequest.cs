using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace Yoma.Core.Infrastructure.SAYouth.Models
{
  public class OpportunityActionRequest
  {
    [JsonProperty("opportunity_id")]
    public int OpportunityId { get; set; }

    [JsonProperty("reason")]
    public string? Reason { get; set; }

    [JsonProperty("closing_date")]
    [JsonConverter(typeof(IsoDateTimeConverter), "yyyy-MM-dd")]
    public DateTimeOffset? ClosingDate { get; set; }
  }
}
