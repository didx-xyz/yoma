using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Referral;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Referral.Repositories
{
  public class ProgramRepository : BaseRepository<Entities.Program, Guid>, IRepositoryBatchedValueContainsWithNavigation<Program>
  {
    #region Constructor
    public ProgramRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Program> Query()
    {
      return Query(false);
    }

    public IQueryable<Program> Query(bool includeChildItems)
    {
      return _context.ReferralProgram.Select(entity => new Program
      {
        Id = entity.Id,
        Name = entity.Name,
        Description = entity.Description,
        ImageId = entity.ImageId,
        ImageStorageType = entity.Image == null ? null : Enum.Parse<StorageType>(entity.Image.StorageType, true),
        ImageKey = entity.Image == null ? null : entity.Image.Key,
        CompletionWindowInDays = entity.CompletionWindowInDays,
        CompletionLimitReferee = entity.CompletionLimitReferee,
        CompletionLimit = entity.CompletionLimit,
        CompletionTotal = entity.CompletionTotal,
        ZltoRewardReferrer = entity.ZltoRewardReferrer,
        ZltoRewardReferee = entity.ZltoRewardReferee,
        ZltoRewardPool = entity.ZltoRewardPool,
        ZltoRewardCumulative = entity.ZltoRewardCumulative,
        ProofOfPersonhoodRequired = entity.ProofOfPersonhoodRequired,
        PathwayRequired = entity.PathwayRequired,
        MultipleLinksAllowed = entity.MultipleLinksAllowed,
        StatusId = entity.StatusId,
        Status = Enum.Parse<ProgramStatus>(entity.Status.Name, true),
        IsDefault = entity.IsDefault,
        DateStart = entity.DateStart,
        DateEnd = entity.DateEnd,
        DateCreated = entity.DateCreated,
        CreatedByUserId = entity.CreatedByUserId,
        DateModified = entity.DateModified,
        ModifiedByUserId = entity.ModifiedByUserId,
        Pathway = includeChildItems && entity.Pathway != null ? new ProgramPathway
        {
          Id = entity.Pathway.Id,
          ProgramId = entity.Pathway.ProgramId,
          Name = entity.Pathway.Name,
          Description = entity.Pathway.Description,
          Rule = Enum.Parse<PathwayCompletionRule>(entity.Pathway.Rule, true),
          OrderMode = Enum.Parse<PathwayOrderMode>(entity.Pathway.OrderMode, true),
          DateCreated = entity.Pathway.DateCreated,
          DateModified = entity.Pathway.DateModified,
          Steps = entity.Pathway.Steps.Select(step => new ProgramPathwayStep
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
                Title = task.Opportunity.Title
              },
              Order = task.Order,
              OrderDisplay = task.OrderDisplay,
              DateCreated = task.DateCreated,
              DateModified = task.DateModified
            }).OrderBy(t => t.OrderDisplay).ToList()
          }).OrderBy(s => s.OrderDisplay).ToList()
        } : null
      }).AsSplitQuery();
    }

    public Expression<Func<Program, bool>> Contains(Expression<Func<Program, bool>> predicate, string value)
    {
      //MS SQL: Contains
      return predicate.Or(o => EF.Functions.ILike(o.Name, $"%{value}%")
          || (!string.IsNullOrEmpty(o.Description) && EF.Functions.ILike(o.Description, $"%{value}%")));
    }

    public IQueryable<Program> Contains(IQueryable<Program> query, string value)
    {
      //MS SQL: Contains
      return query.Where(o => EF.Functions.ILike(o.Name, $"%{value}%")
          || (!string.IsNullOrEmpty(o.Description) && EF.Functions.ILike(o.Description, $"%{value}%")));
    }

    public async Task<Program> Create(Program item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.Program
      {
        Id = item.Id,
        Name = item.Name,
        Description = item.Description,
        ImageId = item.ImageId,
        CompletionWindowInDays = item.CompletionWindowInDays,
        CompletionLimitReferee = item.CompletionLimitReferee,
        CompletionLimit = item.CompletionLimit,
        CompletionTotal = item.CompletionTotal,
        ZltoRewardReferrer = item.ZltoRewardReferrer,
        ZltoRewardReferee = item.ZltoRewardReferee,
        ZltoRewardPool = item.ZltoRewardPool,
        ZltoRewardCumulative = item.ZltoRewardCumulative,
        ProofOfPersonhoodRequired = item.ProofOfPersonhoodRequired,
        PathwayRequired = item.PathwayRequired,
        MultipleLinksAllowed = item.MultipleLinksAllowed,
        StatusId = item.StatusId,
        IsDefault = item.IsDefault,
        DateStart = item.DateStart,
        DateEnd = item.DateEnd,
        DateCreated = item.DateCreated,
        CreatedByUserId = item.CreatedByUserId,
        DateModified = item.DateModified,
        ModifiedByUserId = item.ModifiedByUserId
      };

      _context.ReferralProgram.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<List<Program>> Create(List<Program> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var entities = items.Select(item =>
        new Entities.Program
        {
          Id = item.Id,
          Name = item.Name,
          Description = item.Description,
          CompletionWindowInDays = item.CompletionWindowInDays,
          CompletionLimitReferee = item.CompletionLimitReferee,
          CompletionLimit = item.CompletionLimit,
          CompletionTotal = item.CompletionTotal,
          ZltoRewardReferrer = item.ZltoRewardReferrer,
          ZltoRewardReferee = item.ZltoRewardReferee,
          ZltoRewardPool = item.ZltoRewardPool,
          ZltoRewardCumulative = item.ZltoRewardCumulative,
          ProofOfPersonhoodRequired = item.ProofOfPersonhoodRequired,
          PathwayRequired = item.PathwayRequired,
          MultipleLinksAllowed = item.MultipleLinksAllowed,
          StatusId = item.StatusId,
          IsDefault = item.IsDefault,
          DateStart = item.DateStart,
          DateEnd = item.DateEnd,
          DateCreated = DateTimeOffset.UtcNow,
          CreatedByUserId = item.CreatedByUserId,
          DateModified = DateTimeOffset.UtcNow,
          ModifiedByUserId = item.ModifiedByUserId
        });

      _context.ReferralProgram.AddRange(entities);
      await _context.SaveChangesAsync();

      items = [.. items.Zip(entities, (item, entity) =>
      {
        item.Id = entity.Id;
        item.DateCreated = entity.DateCreated;
        item.DateModified = entity.DateModified;
        return item;
      })];

      return items;
    }

    public async Task<Program> Update(Program item)
    {
      var entity = _context.ReferralProgram.Where(o => o.Id == item.Id).SingleOrDefault()
          ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.Program)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.Name = item.Name;
      entity.Description = item.Description;
      entity.CompletionWindowInDays = item.CompletionWindowInDays;
      entity.CompletionLimitReferee = item.CompletionLimitReferee;
      entity.CompletionLimit = item.CompletionLimit;
      entity.CompletionTotal = item.CompletionTotal;
      entity.ZltoRewardReferrer = item.ZltoRewardReferrer;
      entity.ZltoRewardReferee = item.ZltoRewardReferee;
      entity.ZltoRewardPool = item.ZltoRewardPool;
      entity.ZltoRewardCumulative = item.ZltoRewardCumulative;
      entity.ProofOfPersonhoodRequired = item.ProofOfPersonhoodRequired;
      entity.PathwayRequired = item.PathwayRequired;
      entity.MultipleLinksAllowed = item.MultipleLinksAllowed;
      entity.StatusId = item.StatusId;
      entity.IsDefault = item.IsDefault;
      entity.DateStart = item.DateStart;
      entity.DateEnd = item.DateEnd;
      entity.DateModified = item.DateModified;
      entity.ModifiedByUserId = item.ModifiedByUserId;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task<List<Program>> Update(List<Program> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var itemIds = items.Select(o => o.Id).ToList();
      var entities = _context.ReferralProgram.Where(o => itemIds.Contains(o.Id));

      foreach (var item in items)
      {
        var entity = entities.SingleOrDefault(o => o.Id == item.Id) ?? throw new InvalidOperationException($"{nameof(Entities.Program)} with id '{item.Id}' does not exist");

        item.DateModified = DateTimeOffset.UtcNow;

        entity.Name = item.Name;
        entity.Description = item.Description;
        entity.CompletionWindowInDays = item.CompletionWindowInDays;
        entity.CompletionLimitReferee = item.CompletionLimitReferee;
        entity.CompletionLimit = item.CompletionLimit;
        entity.CompletionTotal = item.CompletionTotal;
        entity.ZltoRewardReferrer = item.ZltoRewardReferrer;
        entity.ZltoRewardReferee = item.ZltoRewardReferee;
        entity.ZltoRewardPool = item.ZltoRewardPool;
        entity.ZltoRewardCumulative = item.ZltoRewardCumulative;
        entity.ProofOfPersonhoodRequired = item.ProofOfPersonhoodRequired;
        entity.PathwayRequired = item.PathwayRequired;
        entity.MultipleLinksAllowed = item.MultipleLinksAllowed;
        entity.StatusId = item.StatusId;
        entity.IsDefault = item.IsDefault;
        entity.DateStart = item.DateStart;
        entity.DateEnd = item.DateEnd;
        entity.DateModified = item.DateModified;
        entity.ModifiedByUserId = item.ModifiedByUserId;
      }

      _context.ReferralProgram.UpdateRange(entities);
      await _context.SaveChangesAsync();

      return items;
    }


    public Task Delete(Program item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(List<Program> items)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
