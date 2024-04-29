using Yoma.Core.Domain.ActionLink;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunitySearchFilterLinkInstantVerify : PaginationFilter
  {
    public List<LinkStatus>? Statuses { get; set; }

    public List<Guid>? Opportunities { get; set; }

    public List<Guid>? Organizations { get; set; }
  }
}
