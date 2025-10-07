using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.NewsFeedProvider.Interfaces.Provider;
using Yoma.Core.Domain.NewsFeedProvider.Models;
using Yoma.Core.Infrastructure.Substack.Models;

namespace Yoma.Core.Infrastructure.Substack.Client
{
  public class SubstackClientFactory : INewsFeedProviderClientFactory
  {
    #region Class Variables
    private readonly SubstackOptions _options;
    private readonly IRepositoryBatchedValueContains<NewsArticle> _newsArticleRepository;
    #endregion

    #region Constructor
    public SubstackClientFactory(IOptions<SubstackOptions> options,
      IRepositoryBatchedValueContains<NewsArticle> newsArticleRepository)
    {
      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
      _newsArticleRepository = newsArticleRepository ?? throw new ArgumentNullException(nameof(newsArticleRepository));
    }
    #endregion

    #region Public Members
    public INewsFeedProviderClient CreateClient()
    {
      return new SubstackClient(_options, _newsArticleRepository);
    }
    #endregion
  }
}
