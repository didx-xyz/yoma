using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.ActionLink.Models
{
  public class LinkSearchFilter : PaginationFilter
  {
    public LinkEntityType EntityType { get; set; }

    public LinkAction? Action { get; set; }

    public List<LinkStatus>? Statuses { get; set; }

    public List<Guid>? Entities { get; set; }

    public List<Guid>? Organizations { get; set; }
  }
}
