using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public abstract class MyOpportunitySearchFilterBase : PaginationFilter
  {
    public Action Action { get; set; }

    public List<VerificationStatus>? VerificationStatuses { get; set; }

    [JsonIgnore]
    internal bool TotalCountOnly { get; set; }
  }
}
