using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.NewsFeedProvider.Interfaces.Provider;
using Yoma.Core.Domain.NewsFeedProvider.Models;

namespace Yoma.Core.Infrastructure.Substack.Client
{
  public class SubstackClient : INewsFeedProviderClient
  {
    #region Class Variables
    private readonly IRepositoryValueContains<NewsArticle> _newsArticleRepository;
    #endregion

    #region Constructor
    public SubstackClient(IRepositoryValueContains<NewsArticle> newsArticleRepository)
    {
      _newsArticleRepository = newsArticleRepository ?? throw new ArgumentNullException(nameof(newsArticleRepository));
    }
    #endregion

    #region Public Members
    public NewsArticleSearchResults Search(NewsArticleSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      var query = _newsArticleRepository.Query();

      query = query.Where(o => o.FeedType == filter.FeedType.ToString());

      if (!string.IsNullOrWhiteSpace(filter.ValueContains))
        query = _newsArticleRepository.Contains(query, filter.ValueContains);

      var results = new NewsArticleSearchResults();
      query = query.OrderByDescending(o => o.PublishedDate).ThenByDescending(o => o.DateModified).ThenBy(o => o.Id);

      if (filter.PaginationEnabled)
      {
        results.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      results.Items = [.. query];

      return results;
    }
    #endregion
  }
}
