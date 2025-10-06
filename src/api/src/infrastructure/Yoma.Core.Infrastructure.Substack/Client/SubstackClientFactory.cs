using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.NewsFeedProvider.Interfaces.Provider;
using Yoma.Core.Domain.NewsFeedProvider.Models;

namespace Yoma.Core.Infrastructure.Substack.Client
{
  public class SubstackClientFactory : INewsFeedProviderClientFactory
  {
    #region Class Variables
    private readonly IRepositoryValueContains<NewsArticle> _newsArticleRepository;
    #endregion

    #region Constructor
    public SubstackClientFactory(IRepositoryValueContains<NewsArticle> newsArticleRepository)
    {
      _newsArticleRepository = newsArticleRepository ?? throw new ArgumentNullException(nameof(newsArticleRepository));
    }
    #endregion

    #region Public Members
    public INewsFeedProviderClient CreateClient()
    {
      return new SubstackClient(_newsArticleRepository);
    }
    #endregion
  }
}
