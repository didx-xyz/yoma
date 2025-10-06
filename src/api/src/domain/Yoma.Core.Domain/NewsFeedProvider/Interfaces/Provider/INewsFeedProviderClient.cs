using Yoma.Core.Domain.NewsFeedProvider.Models;

namespace Yoma.Core.Domain.NewsFeedProvider.Interfaces.Provider
{
  public interface INewsFeedProviderClient
  {
    NewsArticleSearchResults Search(NewsArticleSearchFilter filter);
  }
}
