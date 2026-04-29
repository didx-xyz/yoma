using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.NewsFeedProvider.Models;
using Yoma.Core.Infrastructure.Jobberman.Context;
using Yoma.Core.Infrastructure.Jobberman.Models;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Jobberman.Repositories
{
  public sealed class OpportunityRepository : BaseRepository<Entities.Opportunity, Guid>, IRepositoryBatched<Opportunity>
  {
    #region Constructor
    public OpportunityRepository(JobbermanDbContext context) : base(context) { }
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
        CountryCodeAlpha2 = entity.CountryCodeAlpha2,
        SourceId = entity.SourceId,
        Title = entity.Title,
        Description = entity.Description,
        URL = entity.URL,
        ImageURL = entity.ImageURL,
        Location = entity.Location,
        WorkType = entity.WorkType,
        DateStart = entity.DateStart,
        DateEnd = entity.DateEnd,
        Category = entity.Category,
        Language = entity.Language,
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
        CountryCodeAlpha2 = item.CountryCodeAlpha2,
        SourceId = item.SourceId,
        Title = item.Title,
        Description = item.Description,
        URL = item.URL,
        ImageURL = item.ImageURL,
        Location = item.Location,
        WorkType = item.WorkType,
        DateStart = item.DateStart,
        DateEnd = item.DateEnd,
        Category = item.Category,
        Language = item.Language,
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
          CountryCodeAlpha2 = item.CountryCodeAlpha2,
          SourceId = item.SourceId,
          Title = item.Title,
          Description = item.Description,
          URL = item.URL,
          ImageURL = item.ImageURL,
          Location = item.Location,
          WorkType = item.WorkType,
          DateStart = item.DateStart,
          DateEnd = item.DateEnd,
          Category = item.Category,
          Language = item.Language,
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

      entity.Title = item.Title;
      entity.Description = item.Description;
      entity.URL = item.URL;
      entity.ImageURL = item.ImageURL;
      entity.Location = item.Location;
      entity.WorkType = item.WorkType;
      entity.DateStart = item.DateStart;
      entity.DateEnd = item.DateEnd;
      entity.Category = item.Category;
      entity.Language = item.Language;
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

        entity.Title = item.Title;
        entity.Description = item.Description;
        entity.URL = item.URL;
        entity.ImageURL = item.ImageURL;
        entity.Location = item.Location;
        entity.WorkType = item.WorkType;
        entity.DateStart = item.DateStart;
        entity.DateEnd = item.DateEnd;
        entity.Category = item.Category;
        entity.Language = item.Language;
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
       ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(NewsArticle)} with id '{item.Id}' does not exist");

      _context.Remove(entity); //hard delete from cache based on retention period

      await _context.SaveChangesAsync();
    }

    public async Task Delete(List<Opportunity> items)
    {
      var ids = items.Select(i => i.Id).ToList();
      var entities = _context.Opportunity.Where(o => ids.Contains(o.Id)).ToList();

      if (entities.Count != items.Count)
        throw new ArgumentOutOfRangeException(nameof(items), $"{nameof(NewsArticle)}'s with id's {string.Join(", ", ids.Except(entities.Select(e => e.Id)))} do not exist");

      _context.Opportunity.RemoveRange(entities);

      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
