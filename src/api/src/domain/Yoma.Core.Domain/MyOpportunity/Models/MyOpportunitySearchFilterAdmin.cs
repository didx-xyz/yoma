using Newtonsoft.Json;
using Yoma.Core.Domain.Core;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunitySearchFilterAdmin : MyOpportunitySearchFilterBase
  {
    public Guid? UserId { get; set; }

    public Guid? Opportunity { get; set; }

    public List<Guid>? Organizations { get; set; }

    public string? ValueContains { get; set; }

    [JsonIgnore]
    internal override FilterSortOrder SortOrder { get; set; } = FilterSortOrder.Ascending;
  }
}
