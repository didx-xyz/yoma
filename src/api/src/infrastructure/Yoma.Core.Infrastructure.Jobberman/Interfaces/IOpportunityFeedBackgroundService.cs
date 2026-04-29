namespace Yoma.Core.Infrastructure.Jobberman.Interfaces
{
  public interface IOpportunityFeedBackgroundService
  {
    Task RefreshFeeds(bool onStartupInitialRefresh);
  }
}
