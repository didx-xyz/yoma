using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Entity.Repositories.Lookups
{
  public class UserGoalRepository : BaseRepository<Entities.Lookups.UserGoal, Guid>, IRepository<UserGoal>
  {
    #region Constructor
    public UserGoalRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<UserGoal> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<UserGoal> Query()
    {
      return _context.UserGoal.Select(entity => new UserGoal
      {
        Id = entity.Id,
        Name = entity.Name
      });
    }

    public Task<UserGoal> Create(UserGoal item)
    {
      throw new NotImplementedException();
    }

    public Task<UserGoal> Update(UserGoal item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(UserGoal item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
