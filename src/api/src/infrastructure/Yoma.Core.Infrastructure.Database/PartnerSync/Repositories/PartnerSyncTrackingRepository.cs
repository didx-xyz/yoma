using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.PartnerSync.Repositories
{
  public sealed class PartnerSyncTrackingRepository : BaseRepository<Entities.PartnerSyncTracking, Guid>, IRepository<PartnerSyncTracking>
  {
    #region Constructor
    public PartnerSyncTrackingRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<PartnerSyncTracking> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<PartnerSyncTracking> Query()
    {
      return _context.PartnerSyncTracking.Select(entity => new PartnerSyncTracking
      {
        Id = entity.Id,
        PartnerId = entity.PartnerId,
        SyncType = entity.SyncType,
        EntityType = entity.EntityType,
        SyncScope = entity.SyncScope,
        Status = entity.Status,
        ItemsProcessed = entity.ItemsProcessed,
        ItemsSucceeded = entity.ItemsSucceeded,
        ItemsSkipped = entity.ItemsSkipped,
        ItemsFailed = entity.ItemsFailed,
        ItemsCreated = entity.ItemsCreated,
        ItemsUpdated = entity.ItemsUpdated,
        ItemsDeleted = entity.ItemsDeleted,
        RunFailureReason = entity.RunFailureReason,
        DateStamp = entity.DateStamp
      });
    }

    public async Task<PartnerSyncTracking> Create(PartnerSyncTracking item)
    {
      item.DateStamp = DateTimeOffset.UtcNow;

      var entity = new Entities.PartnerSyncTracking
      {
        Id = item.Id,
        PartnerId = item.PartnerId,
        SyncType = item.SyncType,
        EntityType = item.EntityType,
        SyncScope = item.SyncScope,
        Status = item.Status,
        ItemsProcessed = item.ItemsProcessed,
        ItemsSucceeded = item.ItemsSucceeded,
        ItemsSkipped = item.ItemsSkipped,
        ItemsFailed = item.ItemsFailed,
        ItemsCreated = item.ItemsCreated,
        ItemsUpdated = item.ItemsUpdated,
        ItemsDeleted = item.ItemsDeleted,
        RunFailureReason = item.RunFailureReason,
        DateStamp = item.DateStamp
      };

      _context.PartnerSyncTracking.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public Task<PartnerSyncTracking> Update(PartnerSyncTracking item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(PartnerSyncTracking item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
