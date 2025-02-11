namespace Yoma.Core.Domain.Analytics.Models
{
  public class OrganizationSearchResultsSSO
  {
    public List<OrganizationSSOInfo> Items { get; set; }

    public int? OutboundLoginCount { get; set; }

    public int? InboundLoginCount { get; set; }

    public int? TotalCount { get; set; }

    public DateTimeOffset DateStamp { get; set; }
  }
}
