using Microsoft.EntityFrameworkCore;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Opportunity;
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

    public IQueryable<ProgramPathway> Query(bool includeChildItems, LockMode lockMode)
    {
      throw new NotImplementedException();
    }

    public IQueryable<ProgramPathway> Query(LockMode lockMode)
    {
      throw new NotImplementedException();
    }

    public IQueryable<ProgramPathway> Query(bool includeChildItems)
    {
      var query = _context.ReferralProgramPathway.Select(entity => new ProgramPathway
      {
        Id = entity.Id,
        ProgramId = entity.ProgramId,
        Name = entity.Name,
        Description = entity.Description,
        Rule = Enum.Parse<PathwayCompletionRule>(entity.Rule, true),
        OrderMode = Enum.Parse<PathwayOrderMode>(entity.OrderMode, true),
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified,
        Steps = includeChildItems ? entity.Steps.Select(step => new ProgramPathwayStep
        {
          Id = step.Id,
          PathwayId = step.PathwayId,
          Name = step.Name,
          Description = step.Description,
          Rule = Enum.Parse<PathwayCompletionRule>(step.Rule, true),
          OrderMode = Enum.Parse<PathwayOrderMode>(step.OrderMode, true),
          Order = step.Order,
          OrderDisplay = step.OrderDisplay,
          DateCreated = step.DateCreated,
          DateModified = step.DateModified,
          Tasks = step.Tasks.Select(task => new ProgramPathwayTask
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
              VerificationMethod = string.IsNullOrEmpty(task.Opportunity.VerificationMethod) ? null : Enum.Parse<VerificationMethod>(task.Opportunity.VerificationMethod, true),
              Status = Enum.Parse<Status>(task.Opportunity.Status.Name, true),
              Hidden = task.Opportunity.Hidden,
              DateStart = task.Opportunity.DateStart
            },
            Order = task.Order,
            OrderDisplay = task.OrderDisplay,
            DateCreated = task.DateCreated,
            DateModified = task.DateModified
          }).OrderBy(t => t.OrderDisplay).ToList()
        }).OrderBy(s => s.OrderDisplay).ToList() : null
      });

      if (includeChildItems) query = query.AsSplitQuery();
      return query;
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
        Rule = item.Rule.ToString(),
        OrderMode = item.OrderMode.ToString(),
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
      entity.Rule = item.Rule.ToString();
      entity.OrderMode = item.OrderMode.ToString();
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
