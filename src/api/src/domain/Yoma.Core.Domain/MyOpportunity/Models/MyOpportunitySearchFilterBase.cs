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

    /// <summary>
    /// Indicates whether the query should be processed with fewer restrictions, bypassing pagination validation, ordering, 
    /// and expensive data processing (such as URL resolution).
    /// When set to <c>true</c>, pagination validation is skipped, ordering is not applied unless explicitly required, 
    /// and additional costly computations are avoided.
    /// However, if <c>PaginationEnabled</c> is <c>true</c>, pagination will still be applied, but unnecessary processing 
    /// will be minimized.
    /// </summary>
    [JsonIgnore]
    internal bool UnrestrictedQuery { get; set; } = false;

    /// <summary>
    /// Flag indicating whether to include only published records (relating to active opportunities, 
    /// irrespective of their start status, that relate to active organizations) for non-verification actions 
    /// ('Saved,' 'Viewed,' and 'NavigatedExternalLink').
    /// When set to true (default), only published records are included.
    /// When set to false, all records are included, irrespective of their published status.
    /// </summary>
    [JsonIgnore]
    internal bool NonActionVerificationPublishedOnly { get; set; } = true;

    [JsonIgnore]
    internal abstract FilterSortOrder SortOrder { get; set; }
  }
}
