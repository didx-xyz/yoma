using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Lookups.Repositories
{
  public class TargetedGroupRepository : BaseRepository<Entities.TargetedGroup, Guid>,
    IRepository<Domain.Lookups.Models.TargetedGroup>
  {
    #region Constructor
    public TargetedGroupRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Domain.Lookups.Models.TargetedGroup> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<Domain.Lookups.Models.TargetedGroup> Query()
    {
      return _context.TargetedGroup.Select(entity => new Domain.Lookups.Models.TargetedGroup
      {
        Id = entity.Id,
        Name = entity.Name
      });
    }

    public Task<Domain.Lookups.Models.TargetedGroup> Create(Domain.Lookups.Models.TargetedGroup item)
    {
      throw new NotImplementedException();
    }

    public Task<Domain.Lookups.Models.TargetedGroup> Update(Domain.Lookups.Models.TargetedGroup item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(Domain.Lookups.Models.TargetedGroup item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
