using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.PartnerSharing.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.PartnerSharing.Repositories.Lookups
{
  public class ProcessingStatusRepository : BaseRepository<Entities.Lookups.ProcessingStatus, Guid>, IRepository<ProcessingStatus>
  {
    #region Constructor
    public ProcessingStatusRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<ProcessingStatus> Query()
    {
      return _context.PartnerSharingProcessingStatus.Select(entity => new ProcessingStatus
      {
        Id = entity.Id,
        Name = entity.Name
      });
    }

    public Task<ProcessingStatus> Create(ProcessingStatus item)
    {
      throw new NotImplementedException();
    }

    public Task<ProcessingStatus> Update(ProcessingStatus item)
    {
      throw new NotImplementedException();
    }
    public Task Delete(ProcessingStatus item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
