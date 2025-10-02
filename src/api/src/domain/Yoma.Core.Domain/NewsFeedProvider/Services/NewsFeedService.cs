using Yoma.Core.Domain.NewsFeedProvider.Interfaces;
using Yoma.Core.Domain.NewsFeedProvider.Models;

namespace Yoma.Core.Domain.NewsFeedProvider.Services
{
  public class NewsFeedService : INewsFeedService
  {
    #region Class Variables
    #endregion

    #region Constructor
    public NewsFeedService() { }
    #endregion

    #region Public Members
    public NewsArticleSearchResults Search(NewsArticleSearchFilter filter)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
