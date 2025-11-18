using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.ActionLink.Models
{
  public class LinkSearchFilterUsage : PaginationFilter
  {
    public Guid Id { get; set; }

    public ActionLinkUsageStatus Usage { get; set; } = ActionLinkUsageStatus.All;

    public string? ValueContains { get; set; }
  }
}
