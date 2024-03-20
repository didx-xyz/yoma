using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity;

namespace Yoma.Core.Domain.Entity.Models
{
  public class OrganizationSearchFilter : PaginationFilter
  {
    public string? ValueContains { get; set; }

    public List<Status>? Statuses { get; set; }

    [JsonIgnore]
    internal List<Guid> Organizations { get; set; }

    [JsonIgnore]
    internal bool InternalUse { get; set; }
  }
}
