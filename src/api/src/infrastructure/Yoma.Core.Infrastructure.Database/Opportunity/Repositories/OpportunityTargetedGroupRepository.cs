using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Repositories
{
  public class OpportunityTargetedGroupRepository : BaseRepository<Entities.OpportunityTargetedGroup, Guid>, IRepository<OpportunityTargetedGroup>
  {
    #region Constructor
    public OpportunityTargetedGroupRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<OpportunityTargetedGroup> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<OpportunityTargetedGroup> Query()
    {
      return _context.OpportunityTargetedGroups.Select(entity => new OpportunityTargetedGroup
      {
        Id = entity.Id,
        OpportunityId = entity.OpportunityId,
        OpportunityStatusId = entity.Opportunity.Status.Id,
        OpportunityDateStart = entity.Opportunity.DateStart,
        OpporunityHidden = entity.Opportunity.Hidden,
        OrganizationId = entity.Opportunity.OrganizationId,
        OrganizationStatusId = entity.Opportunity.Organization.Status.Id,
        TargetedGroupId = entity.TargetedGroupId,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<OpportunityTargetedGroup> Create(OpportunityTargetedGroup item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;

      var entity = new Entities.OpportunityTargetedGroup
      {
        Id = item.Id,
        OpportunityId = item.OpportunityId,
        TargetedGroupId = item.TargetedGroupId,
        DateCreated = item.DateCreated,
      };

      _context.OpportunityTargetedGroups.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public Task<OpportunityTargetedGroup> Update(OpportunityTargetedGroup item)
    {
      throw new NotImplementedException();
    }

    public async Task Delete(OpportunityTargetedGroup item)
    {
      var entity = _context.OpportunityTargetedGroups
        .Where(o => o.Id == item.Id)
        .SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(OpportunityTargetedGroup)} with id '{item.Id}' does not exist");

      _context.OpportunityTargetedGroups.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
