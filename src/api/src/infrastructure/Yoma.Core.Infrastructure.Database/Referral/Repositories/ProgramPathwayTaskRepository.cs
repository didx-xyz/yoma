using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Referral;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Referral.Repositories
{
  public class ProgramPathwayTaskRepository : BaseRepository<Entities.ProgramPathwayTask, Guid>, IRepository<ProgramPathwayTask>
  {
    #region Constructor
    public ProgramPathwayTaskRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<ProgramPathwayTask> Query()
    {
      return _context.ReferralProgramPathwayTask.Select(entity => new ProgramPathwayTask
      {
        Id = entity.Id,
        StepId = entity.StepId,
        EntityType = Enum.Parse<PathwayTaskEntityType>(entity.EntityType, true),
        Opportunity = entity.Opportunity == null ? null : new Domain.Opportunity.Models.OpportunityItem
        {
          Id = entity.Opportunity.Id,
          Title = entity.Opportunity.Title
        },
        Order = entity.Order,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified
      }).OrderBy(t => t.Order.HasValue).ThenBy(t => t.Order).ThenBy(t => t.Opportunity == null ? null : t.Opportunity.Title);
    }

    public async Task<ProgramPathwayTask> Create(ProgramPathwayTask item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.ProgramPathwayTask
      {
        Id = item.Id,
        StepId = item.StepId,
        EntityType = item.EntityType.ToString(),
        OpportunityId = item.Opportunity?.Id,
        Order = item.Order,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.ReferralProgramPathwayTask.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }
    public async Task<ProgramPathwayTask> Update(ProgramPathwayTask item)
    {
      var entity = _context.ReferralProgramPathwayTask.Where(o => o.Id == item.Id).SingleOrDefault()
         ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.ProgramPathwayTask)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.EntityType = item.EntityType.ToString();
      entity.OpportunityId = item.Opportunity?.Id;
      entity.Order = item.Order;
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task Delete(ProgramPathwayTask item)
    {
      var entity = _context.ReferralProgramPathwayTask.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(ProgramPathwayTask)} with id '{item.Id}' does not exist");
      _context.ReferralProgramPathwayTask.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
