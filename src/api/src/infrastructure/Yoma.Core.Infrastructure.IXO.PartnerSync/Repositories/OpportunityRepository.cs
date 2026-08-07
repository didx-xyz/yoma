using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.IXO.PartnerSync.Context;
using Yoma.Core.Infrastructure.IXO.PartnerSync.Models;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.IXO.PartnerSync.Repositories
{
  public sealed class OpportunityRepository : BaseRepository<Entities.Opportunity, Guid>, IRepositoryBatched<Opportunity>
  {
    #region Constructor
    public OpportunityRepository(IXOPartnerSyncDbContext context) : base(context) { }
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

    public async Task<Opportunity> Create(Opportunity item) => (await Create([item])).Single();

    public async Task<List<Opportunity>> Create(List<Opportunity> items)
    {
      ArgumentNullException.ThrowIfNull(items);
      if (items.Count == 0) return items;

      var now = DateTimeOffset.UtcNow;
      var entities = items.Select(item => Map(item, now)).ToList();

      _context.Opportunity.AddRange(entities);
      await _context.SaveChangesAsync();

      foreach (var (item, entity) in items.Zip(entities))
        Map(entity, item);

      return items;
    }

    public async Task<Opportunity> Update(Opportunity item) => (await Update([item])).Single();

    public async Task<List<Opportunity>> Update(List<Opportunity> items)
    {
      ArgumentNullException.ThrowIfNull(items);
      if (items.Count == 0) return items;

      var ids = items.Select(o => o.Id).ToList();
      var entities = _context.Opportunity.Where(o => ids.Contains(o.Id)).ToList();

      if (entities.Count != items.Count)
        throw new ArgumentOutOfRangeException(nameof(items), $"{nameof(Opportunity)} records with id's '{string.Join(", ", ids.Except(entities.Select(o => o.Id)))}' do not exist");

      var now = DateTimeOffset.UtcNow;
      foreach (var item in items)
      {
        var entity = entities.Single(o => o.Id == item.Id);
        MapMutable(item, entity, now);
        Map(entity, item);
      }

      _context.Opportunity.UpdateRange(entities);
      await _context.SaveChangesAsync();

      return items;
    }

    public async Task Delete(Opportunity item) => await Delete([item]);

    public async Task Delete(List<Opportunity> items)
    {
      ArgumentNullException.ThrowIfNull(items);
      if (items.Count == 0) return;

      var ids = items.Select(o => o.Id).ToList();
      var entities = _context.Opportunity.Where(o => ids.Contains(o.Id)).ToList();

      if (entities.Count != items.Count)
        throw new ArgumentOutOfRangeException(nameof(items), $"{nameof(Opportunity)} records with id's '{string.Join(", ", ids.Except(entities.Select(o => o.Id)))}' do not exist");

      _context.Opportunity.RemoveRange(entities);
      await _context.SaveChangesAsync();
    }
    #endregion

    #region Private Members
    private static Entities.Opportunity Map(Opportunity item, DateTimeOffset now)
    {
      return new Entities.Opportunity
      {
        Id = item.Id,
        ExternalId = item.ExternalId,
        PayloadHash = item.PayloadHash,
        PayloadJson = item.PayloadJson,
        Deleted = item.Deleted,
        DateCreated = now,
        DateModified = now
      };
    }

    private static void MapMutable(Opportunity item, Entities.Opportunity entity, DateTimeOffset now)
    {
      entity.PayloadHash = item.PayloadHash;
      entity.PayloadJson = item.PayloadJson;
      entity.Deleted = item.Deleted;
      entity.DateModified = now;
    }

    private static void Map(Entities.Opportunity entity, Opportunity item)
    {
      item.Id = entity.Id;
      item.DateCreated = entity.DateCreated;
      item.DateModified = entity.DateModified;
    }
    #endregion
  }
}
