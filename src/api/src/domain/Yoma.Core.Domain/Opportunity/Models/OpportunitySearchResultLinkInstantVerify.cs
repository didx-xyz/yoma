using Yoma.Core.Domain.ActionLink.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunitySearchResultLinkInstantVerify
  {
    public int? TotalCount { get; set; }

    public List<LinkInfo> Items { get; set; }
  }
}

