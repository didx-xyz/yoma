using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;

namespace Yoma.Core.Infrastructure.Database.Core.Repositories.Lookups
{
  public class DownloadScheduleStatusRepository : BaseRepository<Entities.Lookups.DownloadScheduleStatus, Guid>, IRepository<DownloadScheduleStatus>
  {
    #region Constructor
    public DownloadScheduleStatusRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<DownloadScheduleStatus> Query()
    {
      return _context.DownloadScheduleStatus.Select(entity => new DownloadScheduleStatus
      {
        Id = entity.Id,
        Name = entity.Name
      });
    }

    public Task<DownloadScheduleStatus> Create(DownloadScheduleStatus item)
    {
      throw new NotImplementedException();
    }

    public Task<DownloadScheduleStatus> Update(DownloadScheduleStatus item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(DownloadScheduleStatus item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
