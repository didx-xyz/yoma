using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Entity.Models
{
  public class UserSearchFilter : PaginationFilter
  {
    public bool? YoIDOnboarded { get; set; }

    public string? ValueContains { get; set; }

    [JsonIgnore]
    internal bool TotalCountOnly { get; set; }

    /// <summary>
    /// Applies a filter to include only users with an associated ExternalId
    /// (i.e., users linked to an identity provider). Enabled by default.
    /// </summary>
    [JsonIgnore]
    internal bool ApplyExternalIdFilter { get; set; } = true;
  }
}
