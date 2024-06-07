using Newtonsoft.Json;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunitySearchCriteriaCommitmentIntervalOption
  {
    public string Id { get; set; }

    public string Name { get; set; }

    [JsonIgnore]
    public short Order { get; set; }

    [JsonIgnore]
    public short Count { get; set; }
  }
}
