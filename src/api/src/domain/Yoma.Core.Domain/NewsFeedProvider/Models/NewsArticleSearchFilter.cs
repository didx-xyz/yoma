using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.NewsFeedProvider.Models
{
  public class NewsArticleSearchFilter : PaginationFilter
  {
    public FeedType FeedType { get; set; }

    public string? ValueContains { get; set; }
  }
}
