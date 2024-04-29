namespace Yoma.Core.Domain.ActionLink.Models
{
  public class LinkSearchResult
  {
    public int? TotalCount { get; set; }

    public List<Link> Items { get; set; }
  }
}
