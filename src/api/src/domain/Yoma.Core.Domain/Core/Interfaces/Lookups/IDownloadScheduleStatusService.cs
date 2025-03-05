namespace Yoma.Core.Domain.Core.Interfaces.Lookups
{
  public interface IDownloadScheduleStatusService
  {
    Models.Lookups.DownloadScheduleStatus GetByName(string name);

    Models.Lookups.DownloadScheduleStatus? GetByNameOrNull(string name);

    Models.Lookups.DownloadScheduleStatus GetById(Guid id);

    Models.Lookups.DownloadScheduleStatus? GetByIdOrNull(Guid id);

    List<Models.Lookups.DownloadScheduleStatus> List();
  }
}
