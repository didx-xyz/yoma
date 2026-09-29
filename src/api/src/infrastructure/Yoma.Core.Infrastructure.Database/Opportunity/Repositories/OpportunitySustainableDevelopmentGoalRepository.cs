using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Repositories
{
  public class OpportunitySustainableDevelopmentGoalRepository : BaseRepository<Entities.OpportunitySustainableDevelopmentGoal, Guid>, IRepository<OpportunitySustainableDevelopmentGoal>
  {
    #region Constructor
    public OpportunitySustainableDevelopmentGoalRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<OpportunitySustainableDevelopmentGoal> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<OpportunitySustainableDevelopmentGoal> Query()
    {
      return _context.OpportunitySustainableDevelopmentGoals.Select(entity => new OpportunitySustainableDevelopmentGoal
      {
        Id = entity.Id,
        OpportunityId = entity.OpportunityId,
        OpportunityStatusId = entity.Opportunity.Status.Id,
        OpportunityDateStart = entity.Opportunity.DateStart,
        OpporunityHidden = entity.Opportunity.Hidden,
        OrganizationId = entity.Opportunity.OrganizationId,
        OrganizationStatusId = entity.Opportunity.Organization.Status.Id,
        SustainableDevelopmentGoalId = entity.SustainableDevelopmentGoalId,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<OpportunitySustainableDevelopmentGoal> Create(OpportunitySustainableDevelopmentGoal item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;

      var entity = new Entities.OpportunitySustainableDevelopmentGoal
      {
        Id = item.Id,
        OpportunityId = item.OpportunityId,
        SustainableDevelopmentGoalId = item.SustainableDevelopmentGoalId,
        DateCreated = item.DateCreated,
      };

      _context.OpportunitySustainableDevelopmentGoals.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public Task<OpportunitySustainableDevelopmentGoal> Update(OpportunitySustainableDevelopmentGoal item)
    {
      throw new NotImplementedException();
    }

    public async Task Delete(OpportunitySustainableDevelopmentGoal item)
    {
      var entity = _context.OpportunitySustainableDevelopmentGoals
        .Where(o => o.Id == item.Id)
        .SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(OpportunitySustainableDevelopmentGoal)} with id '{item.Id}' does not exist");

      _context.OpportunitySustainableDevelopmentGoals.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
