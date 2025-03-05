using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreAccessControlRuleSearchFilter : PaginationFilter
  {
    public string? NameContains { get; set; }

    public List<string>? Stores { get; set; }

    public List<Guid>? Organizations { get; set; }

    public List<StoreAccessControlRuleStatus>? Statuses { get; set; }

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
