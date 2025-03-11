namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IDownloadBackgroundService
  {
    Task ProcessSchedule();

    /// <summary>
    /// Deletes expired files from blob storage, clears the associated FileId, 
    /// and updates the download schedule status to Deleted.
    /// </summary>
    Task ProcessDeletion();
  }
}
