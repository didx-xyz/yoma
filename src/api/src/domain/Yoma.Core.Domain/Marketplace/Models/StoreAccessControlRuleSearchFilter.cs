using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreAccessControlRuleSearchFilter : PaginationFilter
  {
    public string? NameContains { get; set; }

    public List<string>? Stores { get; set; }

    public List<Guid>? Organizations { get; set; }

    public List<StoreAccessControlRuleStatus>? Statuses { get; set; }
  }
}
