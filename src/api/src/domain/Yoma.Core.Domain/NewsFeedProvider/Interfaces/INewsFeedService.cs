using Yoma.Core.Domain.NewsFeedProvider.Models;

namespace Yoma.Core.Domain.NewsFeedProvider.Interfaces
{
  public interface INewsFeedService
  {
    NewsArticleSearchResults Search(NewsArticleSearchFilter filter);
  }
}
