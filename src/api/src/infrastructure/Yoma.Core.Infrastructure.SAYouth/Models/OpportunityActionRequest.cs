using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Converters;

namespace Yoma.Core.Infrastructure.SAYouth.Models
{
  public class OpportunityActionRequest
  {
    [JsonProperty("opportunity_id")]
    public int OpportunityId { get; set; }

    [JsonProperty("reason")]
    public string? Reason { get; set; }

    [JsonProperty("closing_date")]
    [JsonConverter(typeof(IsoDateFormatConverter), "yyyy-MM-dd")]
    public DateTimeOffset? ClosingDate { get; set; }
  }
}
