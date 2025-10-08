namespace Yoma.Core.Domain.NewsFeedProvider.Models
{
  public class NewsArticleSearchResults
  {
    public int? TotalCount { get; set; }

    public List<NewsArticle> Items { get; set; }
  }
}
