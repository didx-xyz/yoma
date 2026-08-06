namespace Yoma.Core.Infrastructure.JobJack.Interfaces
{
  public interface IOpportunityFeedBackgroundService
  {
    Task RefreshFeed(bool onStartupInitialRefresh);
  }
}
