using Microsoft.EntityFrameworkCore;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Referral;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Referral.Repositories
{
  public class ProgramPathwayStepRepository : BaseRepository<Entities.ProgramPathwayStep, Guid>, IRepositoryWithNavigation<ProgramPathwayStep>
  {
    #region Constructor
    public ProgramPathwayStepRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<ProgramPathwayStep> Query()
    {
      return Query(false);
    }

    public IQueryable<ProgramPathwayStep> Query(bool includeChildItems)
    {
      return _context.ReferralProgramPathwayStep.Select(entity => new ProgramPathwayStep
      {
        Id = entity.Id,
        PathwayId = entity.PathwayId,
        Name = entity.Name,
        Description = entity.Description,
        Rule = Enum.Parse<PathwayCompletionRule>(entity.Rule, true),
        OrderMode = Enum.Parse<PathwayOrderMode>(entity.OrderMode, true),
        Order = entity.Order,
        OrderDisplay = entity.OrderDisplay,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified,
        Tasks = includeChildItems ? entity.Tasks.Select(task => new ProgramPathwayTask
        {
          Id = task.Id,
          StepId = task.StepId,
          EntityType = Enum.Parse<PathwayTaskEntityType>(task.EntityType, true),
          Opportunity = task.Opportunity == null ? null : new Domain.Opportunity.Models.OpportunityItem
          {
            Id = task.Opportunity.Id,
            Title = task.Opportunity.Title,
            OrganizationStatus = Enum.Parse<Domain.Entity.OrganizationStatus>(task.Opportunity.Organization.Status.Name, true),
            VerificationEnabled = task.Opportunity.VerificationEnabled,
            Status = Enum.Parse<Domain.Opportunity.Status>(task.Opportunity.Status.Name, true)
          },
          Order = task.Order,
          OrderDisplay = task.OrderDisplay, 
          DateCreated = task.DateCreated,
          DateModified = task.DateModified
        }).OrderBy(t => t.OrderDisplay).ToList() : null
      }).AsSplitQuery();
    }

    public async Task<ProgramPathwayStep> Create(ProgramPathwayStep item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.ProgramPathwayStep
      {
        Id = item.Id,
        PathwayId = item.PathwayId,
        Name = item.Name,
        Description = item.Description,
        Rule = item.Rule.ToString(),
        OrderMode = item.OrderMode.ToString(),
        Order = item.Order,
        OrderDisplay = item.OrderDisplay,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.ReferralProgramPathwayStep.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }
    public async Task<ProgramPathwayStep> Update(ProgramPathwayStep item)
    {
      var entity = _context.ReferralProgramPathwayStep.Where(o => o.Id == item.Id).SingleOrDefault()
         ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.ProgramPathwayStep)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.Name = item.Name;
      entity.Description = item.Description;
      entity.Rule = item.Rule.ToString();
      entity.OrderMode = item.OrderMode.ToString(); 
      entity.Order = item.Order;
      entity.OrderDisplay = item.OrderDisplay;
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task Delete(ProgramPathwayStep item)
    {
      var entity = _context.ReferralProgramPathwayStep.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(ProgramPathwayStep)} with id '{item.Id}' does not exist");
      _context.ReferralProgramPathwayStep.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
