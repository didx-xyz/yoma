using Newtonsoft.Json;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public abstract class MyOpportunitySearchFilterBase : PaginationFilter
  {
    public Action Action { get; set; }

    public List<VerificationStatus>? VerificationStatuses { get; set; }

    [JsonIgnore]
    internal bool TotalCountOnly { get; set; }

    [JsonIgnore]
    internal bool NonPaginatedQuery { get; set; } = false;

    /// <summary>
    /// Flag indicating whether to include only published records (relating to active opportunities, 
    /// irrespective of their start status, that relate to active organizations) for non-verification actions 
    /// ('Saved,' 'Viewed,' and 'NavigatedExternalLink').
    /// When set to true (default), only published records are included.
    /// When set to false, all records are included, irrespective of their published status.
    /// </summary>
    internal bool NonActionVerificationPublishedOnly { get; set; } = true;

    [JsonIgnore]
    internal abstract FilterSortOrder SortOrder { get; set; }
  }
}
