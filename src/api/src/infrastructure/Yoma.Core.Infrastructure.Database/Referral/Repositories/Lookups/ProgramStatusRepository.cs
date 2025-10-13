using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Referral.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Referral.Repositories.Lookups
{
  public class ProgramStatusRepository : BaseRepository<Entities.Lookups.ProgramStatus, Guid>, IRepository<ProgramStatus>
  {
    #region Constructor
    public ProgramStatusRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<ProgramStatus> Query()
    {
      return _context.OpportunityStatus.Select(entity => new ProgramStatus
      {
        Id = entity.Id,
        Name = entity.Name
      });
    }

    public Task<ProgramStatus> Create(ProgramStatus item)
    {
      throw new NotImplementedException();
    }

    public Task<ProgramStatus> Update(ProgramStatus item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(ProgramStatus item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
