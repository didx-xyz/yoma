using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IDownloadService
  {
    Task Schedule<T>(Guid userId, DownloadScheduleType type, T filter) where T : class, IHashableObject;

    List<DownloadSchedule> ListPendingSchedule(int batchSize, List<Guid> idsToSkip);

    List<DownloadSchedule> ListPendingDeletion(int batchSize, List<Guid> idsToSkip);

    Task UpdateSchedule(DownloadSchedule item);

    Task UpdateSchedule(List<DownloadSchedule> items);
  }
}
