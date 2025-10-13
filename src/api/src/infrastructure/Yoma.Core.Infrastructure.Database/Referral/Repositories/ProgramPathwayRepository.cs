using Microsoft.EntityFrameworkCore;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Referral;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Referral.Repositories
{
  public class ProgramPathwayRepository : BaseRepository<Entities.ProgramPathway, Guid>, IRepositoryWithNavigation<ProgramPathway>
  {
    #region Constructor
    public ProgramPathwayRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<ProgramPathway> Query()
    {
      return Query(false);
    }

    public IQueryable<ProgramPathway> Query(bool includeChildItems)
    {
      return _context.ReferralProgramPathway.Select(entity => new ProgramPathway
      {
        Id = entity.Id,
        ProgramId = entity.ProgramId,
        Name = entity.Name,
        Description = entity.Description,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified,
        Steps = includeChildItems ? entity.Steps.Select(step => new ProgramPathwayStep
        {
          Id = step.Id,
          PathwayId = step.PathwayId,
          Name = step.Name,
          Description = step.Description,
          Rule = Enum.Parse<PathwayStepRule>(step.Rule, true),
          Order = step.Order,
          DateCreated = step.DateCreated,
          DateModified = step.DateModified,
          Tasks = step.Tasks.Select(task => new ProgramPathwayTask
          {
            Id = task.Id,
            StepId = task.StepId,
            EntityType = task.EntityType,
            OpportunityId = task.OpportunityId,
            Opportunity = task.Opportunity == null ? null : new Domain.Opportunity.Models.OpportunityItem
            {
              Id = task.Opportunity.Id,
              Title = task.Opportunity.Title
            },
            Order = task.Order,
            DateCreated = task.DateCreated,
            DateModified = task.DateModified
          }).OrderBy(t => t.Order == null).ThenBy(t => t.Order).ThenBy(t => t.Opportunity == null ? null : t.Opportunity.Title).ToList()
        }).OrderBy(s => s.Order == null).ThenBy(s => s.Order).ThenBy(s => s.Name).ToList() : null
      }).AsSplitQuery();
    }

    public async Task<ProgramPathway> Create(ProgramPathway item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.ProgramPathway
      {
        Id = item.Id,
        ProgramId = item.ProgramId,
        Name = item.Name,
        Description = item.Description,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.ReferralProgramPathway.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }
    public async Task<ProgramPathway> Update(ProgramPathway item)
    {
      var entity = _context.ReferralProgramPathway.Where(o => o.Id == item.Id).SingleOrDefault()
         ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.ProgramPathway)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.Name = item.Name;
      entity.Description = item.Description;
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task Delete(ProgramPathway item)
    {
      var entity = _context.ReferralProgramPathway.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(ProgramPathway)} with id '{item.Id}' does not exist");
      _context.ReferralProgramPathway.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
