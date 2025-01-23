using Newtonsoft.Json;
using Yoma.Core.Domain.Core;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunityRequestVerifyCommitmentInterval
  {
    public Guid Id { get; set; }

    public short Count { get; set; }

    [JsonIgnore]
    internal TimeIntervalOption? Option { get; set; }
  }
}
