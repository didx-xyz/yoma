using Yoma.Core.Domain.NewsFeedProvider.Models;

namespace Yoma.Core.Domain.NewsFeedProvider.Interfaces.Provider
{
  public interface INewsFeedProviderClient
  {
    List<NewsFeed> ListFeeds();

    NewsArticleSearchResults Search(NewsArticleSearchFilter filter);
  }
}
