using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Alison.Context;
using Yoma.Core.Infrastructure.Shared.Extensions;
using Yoma.Core.Infrastructure.Alison.Models;

namespace Yoma.Core.Infrastructure.Alison.Repositories
{
  public sealed class OpportunityRepository : BaseRepository<Entities.Opportunity, Guid>, IRepositoryBatched<Opportunity>
  {
    #region Constructor
    public OpportunityRepository(AlisonDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Opportunity> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<Opportunity> Query()
    {
      return _context.Opportunity.Select(entity => new Opportunity
      {
        Id = entity.Id,
        ExternalId = entity.ExternalId,
        PayloadHash = entity.PayloadHash,
        PayloadJson = entity.PayloadJson,
        Deleted = entity.Deleted,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified
      });
    }

    public async Task<Opportunity> Create(Opportunity item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.Opportunity
      {
        Id = item.Id,
        ExternalId = item.ExternalId,
        PayloadHash = item.PayloadHash,
        PayloadJson = item.PayloadJson,
        Deleted = item.Deleted,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.Opportunity.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<List<Opportunity>> Create(List<Opportunity> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var now = DateTimeOffset.UtcNow;

      var entities = items.Select(item =>
        new Entities.Opportunity
        {
          Id = item.Id,
          ExternalId = item.ExternalId,
          PayloadHash = item.PayloadHash,
          PayloadJson = item.PayloadJson,
          Deleted = item.Deleted,
          DateCreated = now,
          DateModified = now
        }).ToList();

      _context.Opportunity.AddRange(entities);
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

    public async Task<Opportunity> Update(Opportunity item)
    {
      var entity = _context.Opportunity.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Opportunity)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.PayloadHash = item.PayloadHash;
      entity.PayloadJson = item.PayloadJson;
      entity.Deleted = item.Deleted;
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task<List<Opportunity>> Update(List<Opportunity> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var itemIds = items.Select(o => o.Id).ToList();
      var entities = _context.Opportunity.Where(o => itemIds.Contains(o.Id));

      foreach (var item in items)
      {
        var entity = entities.SingleOrDefault(o => o.Id == item.Id)
          ?? throw new InvalidOperationException($"{nameof(Opportunity)} with id '{item.Id}' does not exist");

        item.DateModified = DateTimeOffset.UtcNow;

        entity.PayloadHash = item.PayloadHash;
        entity.PayloadJson = item.PayloadJson;
        entity.Deleted = item.Deleted;
        entity.DateModified = item.DateModified;
      }

      _context.Opportunity.UpdateRange(entities);
      await _context.SaveChangesAsync();

      return items;
    }

    public async Task Delete(Opportunity item)
    {
      var entity = _context.Opportunity.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Opportunity)} with id '{item.Id}' does not exist");

      _context.Remove(entity); //hard delete from cache based on retention period

      await _context.SaveChangesAsync();
    }

    public async Task Delete(List<Opportunity> items)
    {
      var ids = items.Select(i => i.Id).ToList();
      var entities = _context.Opportunity.Where(o => ids.Contains(o.Id)).ToList();

      if (entities.Count != items.Count)
        throw new ArgumentOutOfRangeException(nameof(items), $"{nameof(Opportunity)}'s with id's {string.Join(", ", ids.Except(entities.Select(e => e.Id)))} do not exist");

      _context.Opportunity.RemoveRange(entities);

      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
