using Yoma.Core.Domain.NewsFeedProvider.Models;

namespace Yoma.Core.Domain.NewsFeedProvider.Interfaces
{
  public interface INewsFeedService
  {
    List<NewsFeed> ListFeeds();

    NewsArticleSearchResults Search(NewsArticleSearchFilter filter);
  }
}
