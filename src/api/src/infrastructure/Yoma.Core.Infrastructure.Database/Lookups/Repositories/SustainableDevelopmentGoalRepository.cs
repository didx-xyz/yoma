using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Lookups.Repositories
{
  public class SustainableDevelopmentGoalRepository : BaseRepository<Entities.SustainableDevelopmentGoal, Guid>,
    IRepository<Domain.Lookups.Models.SustainableDevelopmentGoal>
  {
    #region Constructor
    public SustainableDevelopmentGoalRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Domain.Lookups.Models.SustainableDevelopmentGoal> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<Domain.Lookups.Models.SustainableDevelopmentGoal> Query()
    {
      return _context.SustainableDevelopmentGoal.Select(entity => new Domain.Lookups.Models.SustainableDevelopmentGoal
      {
        Id = entity.Id,
        Number = entity.Number,
        Name = entity.Name
      });
    }

    public Task<Domain.Lookups.Models.SustainableDevelopmentGoal> Create(Domain.Lookups.Models.SustainableDevelopmentGoal item)
    {
      throw new NotImplementedException();
    }

    public Task<Domain.Lookups.Models.SustainableDevelopmentGoal> Update(Domain.Lookups.Models.SustainableDevelopmentGoal item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(Domain.Lookups.Models.SustainableDevelopmentGoal item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
