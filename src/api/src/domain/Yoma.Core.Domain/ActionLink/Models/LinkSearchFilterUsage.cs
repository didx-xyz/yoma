using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.ActionLink.Models
{
  public class LinkSearchFilterUsage : PaginationFilter
  {
    public Guid Id { get; set; }

    public LinkUsageStatus Usage { get; set; } = LinkUsageStatus.All;

    public string? ValueContains { get; set; }
  }
}
