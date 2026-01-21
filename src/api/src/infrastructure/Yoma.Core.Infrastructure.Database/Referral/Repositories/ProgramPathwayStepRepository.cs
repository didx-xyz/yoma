using Microsoft.EntityFrameworkCore;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Referral;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

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

    public IQueryable<ProgramPathwayStep> Query(bool includeChildItems, LockMode lockMode)
    {
      return Query(includeChildItems).WithLock(lockMode);
    }

    public IQueryable<ProgramPathwayStep> Query(LockMode lockMode)
    {
      return Query(false).WithLock(lockMode);
    }

    public IQueryable<ProgramPathwayStep> Query(bool includeChildItems)
    {
      var query = _context.ReferralProgramPathwayStep.Select(entity => new ProgramPathwayStep
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
            VerificationMethod = string.IsNullOrEmpty(task.Opportunity.VerificationMethod) ? null : Enum.Parse<VerificationMethod>(task.Opportunity.VerificationMethod, true),
            Status = Enum.Parse<Status>(task.Opportunity.Status.Name, true),
            Hidden = task.Opportunity.Hidden,
            DateStart = task.Opportunity.DateStart,
            Countries = task.Opportunity.Countries.Select(oc => new Domain.Lookups.Models.Country
            {
              Id = oc.Country.Id,
              Name = oc.Country.Name,
              CodeAlpha2 = oc.Country.CodeAlpha2,
              CodeAlpha3 = oc.Country.CodeAlpha3,
              CodeNumeric = oc.Country.CodeNumeric
            }).OrderBy(oc => oc.Name).ToList()
          },
          Order = task.Order,
          OrderDisplay = task.OrderDisplay,
          DateCreated = task.DateCreated,
          DateModified = task.DateModified,
          ProgramCountries = entity.Pathway.Program.Countries == null ? null : entity.Pathway.Program.Countries.Select(pc => new Domain.Lookups.Models.Country
          {
            Id = pc.Country.Id,
            Name = pc.Country.Name,
            CodeAlpha2 = pc.Country.CodeAlpha2,
            CodeAlpha3 = pc.Country.CodeAlpha3,
            CodeNumeric = pc.Country.CodeNumeric
          }).OrderBy(pc => pc.Name).ToList(),
        }).OrderBy(t => t.OrderDisplay).ToList() : null
      });

      if (includeChildItems) query = query.AsSplitQuery();
      return query;
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
