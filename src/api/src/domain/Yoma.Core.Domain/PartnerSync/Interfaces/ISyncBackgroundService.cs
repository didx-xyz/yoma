namespace Yoma.Core.Domain.PartnerSync.Interfaces
{
  public interface ISyncBackgroundService
  {
    Task ProcessSyncPush();

    Task ProcessSyncPull();
  }
}
