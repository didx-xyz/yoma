using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.NewsFeedProvider.Interfaces.Provider;
using Yoma.Core.Domain.NewsFeedProvider.Models;
using Yoma.Core.Infrastructure.Substack.Models;

namespace Yoma.Core.Infrastructure.Substack.Client
{
  public class SubstackClient : INewsFeedProviderClient
  {
    #region Class Variables
    private readonly SubstackOptions _options;
    private readonly IRepositoryBatchedValueContains<NewsArticle> _newsArticleRepository;
    #endregion

    #region Constructor
    public SubstackClient(SubstackOptions options,
      IRepositoryBatchedValueContains<NewsArticle> newsArticleRepository)
    {
      _options = options ?? throw new ArgumentNullException(nameof(options));
      _newsArticleRepository = newsArticleRepository ?? throw new ArgumentNullException(nameof(newsArticleRepository));
    }
    #endregion

    #region Public Members
    public List<NewsFeed> ListFeeds()
    {
      return _options.Feeds.Select(kvp => new NewsFeed
      {
        Type = kvp.Key,
        Title = kvp.Value.Title,
        URL = kvp.Value.URL
      }).ToList();
    }

    public NewsArticleSearchResults Search(NewsArticleSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      var query = _newsArticleRepository.Query();

      if (filter.FeedType.HasValue)
        query = query.Where(o => o.FeedType == filter.FeedType.ToString());

      if (filter.StartDate.HasValue)
      {
        filter.StartDate = filter.StartDate.Value.RemoveTime();
        query = query.Where(o => o.PublishedDate >= filter.StartDate.Value);
      }

      if (filter.EndDate.HasValue)
      {
        filter.EndDate = filter.EndDate.Value.ToEndOfDay();
        query = query.Where(o => o.PublishedDate <= filter.EndDate.Value);
      }

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
