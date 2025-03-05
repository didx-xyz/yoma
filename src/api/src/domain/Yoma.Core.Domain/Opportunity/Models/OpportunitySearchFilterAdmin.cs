using Newtonsoft.Json;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunitySearchFilterAdmin : OpportunitySearchFilterBase
  {
    public DateTimeOffset? StartDate { get; set; }

    public DateTimeOffset? EndDate { get; set; }

    public List<Status>? Statuses { get; set; }

    [JsonIgnore]
    /// <summary>
    /// Indicates whether the query should be processed with fewer restrictions, bypassing pagination validation, ordering, 
    /// and expensive data processing (such as URL resolution).
    /// When set to <c>true</c>, pagination validation is skipped, ordering is not applied unless explicitly required, 
    /// and additional costly computations are avoided.
    /// However, if <c>PaginationEnabled</c> is <c>true</c>, pagination will still be applied, but unnecessary processing 
    /// will be minimized.
    /// </summary>
    internal bool UnrestrictedQuery { get; set; } = false;
  }
}
