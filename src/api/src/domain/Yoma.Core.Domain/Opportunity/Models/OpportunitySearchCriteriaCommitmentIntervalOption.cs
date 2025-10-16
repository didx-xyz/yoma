using Newtonsoft.Json;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunitySearchCriteriaCommitmentIntervalOption
  {
    public string Id { get; set; } = null!;

    public string Name { get; set; } = null!;

    [JsonIgnore]
    public short Order { get; set; }

    [JsonIgnore]
    public short Count { get; set; }
  }
}
