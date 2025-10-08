namespace Yoma.Core.Infrastructure.Substack.Interfaces
{
  public interface INewsFeedBackgroundService
  {
    Task RefreshFeeds(bool onStartupInitialRefresh);
  }
}
