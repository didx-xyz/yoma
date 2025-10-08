namespace Yoma.Core.Domain.NewsFeedProvider.Interfaces.Provider
{
  public interface INewsFeedProviderClientFactory
  {
    INewsFeedProviderClient CreateClient();
  }
}
