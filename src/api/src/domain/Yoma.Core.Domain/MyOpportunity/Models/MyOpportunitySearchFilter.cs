using Newtonsoft.Json;
using Yoma.Core.Domain.Core;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunitySearchFilter : MyOpportunitySearchFilterBase
  {
    [JsonIgnore]
    internal override FilterSortOrder SortOrder { get; set; } = FilterSortOrder.Descending;
  }
}
