namespace Yoma.Core.Domain.ActionLink.Models
{
  public class LinkSearchResultsUsage
  {
    public LinkInfo Link { get; set; } = null!;

    public int? TotalCount { get; set; }

    public List<LinkSearchResultsUsageItem> Items { get; set; } = null!;
  }
}
