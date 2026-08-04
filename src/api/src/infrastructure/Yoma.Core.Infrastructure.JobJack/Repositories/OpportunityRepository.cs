using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.JobJack.Context;
using Yoma.Core.Infrastructure.JobJack.Models;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.JobJack.Repositories
{
  public sealed class OpportunityRepository : BaseRepository<Entities.Opportunity, Guid>, IRepositoryBatched<Opportunity>
  {
    #region Constructor
    public OpportunityRepository(JobJackDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Opportunity> Query(LockMode lockMode) => Query().WithLock(lockMode);

    public IQueryable<Opportunity> Query() => _context.Opportunity.Select(entity => new Opportunity
    {
      Id = entity.Id,
      ExternalId = entity.ExternalId,
      Title = entity.Title,
      Company = entity.Company,
      Description = entity.Description,
      Requirements = entity.Requirements,
      Location = entity.Location,
      City = entity.City,
      Province = entity.Province,
      ContractType = entity.ContractType,
      OpportunitiesAvailable = entity.OpportunitiesAvailable,
      URL = entity.URL,
      SalaryLow = entity.SalaryLow,
      SalaryHigh = entity.SalaryHigh,
      SalaryFrequency = entity.SalaryFrequency,
      SalaryType = entity.SalaryType,
      SalaryAdditional = entity.SalaryAdditional,
      Duration = entity.Duration,
      DateStart = entity.DateStart,
      DateEnd = entity.DateEnd,
      EmploymentStartDate = entity.EmploymentStartDate,
      Category = entity.Category,
      Deleted = entity.Deleted,
      DateCreated = entity.DateCreated,
      DateModified = entity.DateModified
    });

    public async Task<Opportunity> Create(Opportunity item) => (await Create([item])).Single();

    public async Task<List<Opportunity>> Create(List<Opportunity> items)
    {
      if (items == null || items.Count == 0) throw new ArgumentNullException(nameof(items));

      var now = DateTimeOffset.UtcNow;
      var entities = items.Select(item =>
      {
        var entity = new Entities.Opportunity
        {
          Id = item.Id,
          ExternalId = item.ExternalId,
          DateCreated = now,
          DateModified = now
        };
        MapMutable(item, entity);
        return entity;
      }).ToList();

      _context.Opportunity.AddRange(entities);
      await _context.SaveChangesAsync();

      return [.. items.Zip(entities, (item, entity) =>
      {
        item.Id = entity.Id;
        item.DateCreated = entity.DateCreated;
        item.DateModified = entity.DateModified;
        return item;
      })];
    }

    public async Task<Opportunity> Update(Opportunity item) => (await Update([item])).Single();

    public async Task<List<Opportunity>> Update(List<Opportunity> items)
    {
      if (items == null || items.Count == 0) throw new ArgumentNullException(nameof(items));

      var ids = items.Select(o => o.Id).ToList();
      var entities = _context.Opportunity.Where(o => ids.Contains(o.Id)).ToList();

      foreach (var item in items)
      {
        var entity = entities.SingleOrDefault(o => o.Id == item.Id)
          ?? throw new InvalidOperationException($"{nameof(Opportunity)} with id '{item.Id}' does not exist");

        MapMutable(item, entity);
        item.DateModified = entity.DateModified = DateTimeOffset.UtcNow;
      }

      _context.Opportunity.UpdateRange(entities);
      await _context.SaveChangesAsync();
      return items;
    }

    public async Task Delete(Opportunity item) => await Delete([item]);

    public async Task Delete(List<Opportunity> items)
    {
      var ids = items.Select(i => i.Id).ToList();
      var entities = _context.Opportunity.Where(o => ids.Contains(o.Id)).ToList();

      if (entities.Count != items.Count)
        throw new ArgumentOutOfRangeException(nameof(items), $"Opportunities with id's {string.Join(", ", ids.Except(entities.Select(e => e.Id)))} do not exist");

      _context.Opportunity.RemoveRange(entities);
      await _context.SaveChangesAsync();
    }
    #endregion

    #region Private Members
    private static void MapMutable(Opportunity item, Entities.Opportunity entity)
    {
      entity.Title = item.Title;
      entity.Company = item.Company;
      entity.Description = item.Description;
      entity.Requirements = item.Requirements;
      entity.Location = item.Location;
      entity.City = item.City;
      entity.Province = item.Province;
      entity.ContractType = item.ContractType;
      entity.OpportunitiesAvailable = item.OpportunitiesAvailable;
      entity.URL = item.URL;
      entity.SalaryLow = item.SalaryLow;
      entity.SalaryHigh = item.SalaryHigh;
      entity.SalaryFrequency = item.SalaryFrequency;
      entity.SalaryType = item.SalaryType;
      entity.SalaryAdditional = item.SalaryAdditional;
      entity.Duration = item.Duration;
      entity.DateStart = item.DateStart;
      entity.DateEnd = item.DateEnd;
      entity.EmploymentStartDate = item.EmploymentStartDate;
      entity.Category = item.Category;
      entity.Deleted = item.Deleted;
    }
    #endregion
  }
}
