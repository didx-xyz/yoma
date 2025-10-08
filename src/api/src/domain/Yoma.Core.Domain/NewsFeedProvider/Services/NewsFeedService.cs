using FluentValidation;
using Yoma.Core.Domain.NewsFeedProvider.Interfaces;
using Yoma.Core.Domain.NewsFeedProvider.Interfaces.Provider;
using Yoma.Core.Domain.NewsFeedProvider.Models;
using Yoma.Core.Domain.NewsFeedProvider.Validators;

namespace Yoma.Core.Domain.NewsFeedProvider.Services
{
  public class NewsFeedService : INewsFeedService
  {
    #region Class Variables
    private readonly INewsFeedProviderClient _newsFeedProviderClient;
    private readonly NewsArticleSearchFilterValidator _newsArticleSearchFilterValidator;
    #endregion

    #region Constructor
    public NewsFeedService(INewsFeedProviderClientFactory newsFeedProviderClientFactory,
      NewsArticleSearchFilterValidator newsArticleSearchFilterValidator)
    {
      _newsFeedProviderClient = newsFeedProviderClientFactory.CreateClient();
      _newsArticleSearchFilterValidator = newsArticleSearchFilterValidator ?? throw new ArgumentNullException(nameof(newsArticleSearchFilterValidator));
    }
    #endregion

    #region Public Members
    public List<NewsFeed> ListFeeds()
    {
      return _newsFeedProviderClient.ListFeeds();
    }

    public NewsArticleSearchResults Search(NewsArticleSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _newsArticleSearchFilterValidator.ValidateAndThrow(filter);

      return _newsFeedProviderClient.Search(filter);
    }
    #endregion
  }
}
