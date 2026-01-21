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
  public class ProgramPathwayTaskRepository : BaseRepository<Entities.ProgramPathwayTask, Guid>, IRepository<ProgramPathwayTask>
  {
    #region Constructor
    public ProgramPathwayTaskRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<ProgramPathwayTask> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

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
          Title = entity.Opportunity.Title,
          OrganizationStatus = Enum.Parse<Domain.Entity.OrganizationStatus>(entity.Opportunity.Organization.Status.Name, true),
          VerificationEnabled = entity.Opportunity.VerificationEnabled,
          VerificationMethod = string.IsNullOrEmpty(entity.Opportunity.VerificationMethod) ? null : Enum.Parse<VerificationMethod>(entity.Opportunity.VerificationMethod, true),
          Status = Enum.Parse<Status>(entity.Opportunity.Status.Name, true),
          Hidden = entity.Opportunity.Hidden,
          DateStart = entity.Opportunity.DateStart,
          Countries = entity.Opportunity.Countries.Select(oc => new Domain.Lookups.Models.Country
          {
            Id = oc.Country.Id,
            Name = oc.Country.Name,
            CodeAlpha2 = oc.Country.CodeAlpha2,
            CodeAlpha3 = oc.Country.CodeAlpha3,
            CodeNumeric = oc.Country.CodeNumeric
          }).OrderBy(oc => oc.Name).ToList()
        },
        Order = entity.Order,
        OrderDisplay = entity.OrderDisplay,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified,
        ProgramCountries = entity.Step.Pathway.Program.Countries == null ? null : entity.Step.Pathway.Program.Countries.Select(pc => new Domain.Lookups.Models.Country
        {
          Id = pc.Country.Id,
          Name = pc.Country.Name,
          CodeAlpha2 = pc.Country.CodeAlpha2,
          CodeAlpha3 = pc.Country.CodeAlpha3,
          CodeNumeric = pc.Country.CodeNumeric
        }).OrderBy(pc => pc.Name).ToList()
      }).AsSplitQuery();
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
        OrderDisplay = item.OrderDisplay,
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
      entity.OrderDisplay = item.OrderDisplay;
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
