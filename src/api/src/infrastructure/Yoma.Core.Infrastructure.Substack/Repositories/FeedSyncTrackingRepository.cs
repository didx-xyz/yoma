using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Shared.Extensions;
using Yoma.Core.Infrastructure.Substack.Context;
using Yoma.Core.Infrastructure.Substack.Models;

namespace Yoma.Core.Infrastructure.Substack.Repositories
{
  public class FeedSyncTrackingRepository : BaseRepository<Entities.FeedSyncTracking, Guid>, IRepository<FeedSyncTracking>
  {
    #region Constructor
    public FeedSyncTrackingRepository(SubstackDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<FeedSyncTracking> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<FeedSyncTracking> Query()
    {
      return _context.FeedSyncTracking.Select(entity => new FeedSyncTracking
      {
        Id = entity.Id,
        FeedType = entity.FeedType,
        ETag = entity.ETag,
        FeedLastModified = entity.FeedLastModified,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified
      });
    }

    public async Task<FeedSyncTracking> Create(FeedSyncTracking item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = item.DateCreated;

      var entity = new Entities.FeedSyncTracking
      {
        Id = item.Id,
        FeedType = item.FeedType,
        ETag = item.ETag,
        FeedLastModified = item.FeedLastModified,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.FeedSyncTracking.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<FeedSyncTracking> Update(FeedSyncTracking item)
    {
      var entity = _context.FeedSyncTracking.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(FeedSyncTracking)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.ETag = item.ETag;
      entity.FeedLastModified = item.FeedLastModified;
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();

      return item;
    }

    public Task Delete(FeedSyncTracking item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
