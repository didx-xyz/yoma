using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.PartnerSharing;
using Yoma.Core.Domain.PartnerSharing.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.PartnerSharing.Repositories
{
  public class ProcessingLogRepository : BaseRepository<Entities.ProcessingLog, Guid>, IRepositoryBatched<ProcessingLog>
  {
    #region Constructor
    public ProcessingLogRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<ProcessingLog> Query()
    {
      return _context.PartnerSharingProcessingLog.Select(entity => new ProcessingLog
      {
        Id = entity.Id,
        EntityType = entity.EntityType,
        OpportunityId = entity.OpportunityId,
        PartnerId = entity.PartnerId,
        Action = entity.Action,
        StatusId = entity.StatusId,
        Status = Enum.Parse<ProcessingStatus>(entity.Status.Name, true),
        EntityExternalId = entity.EntityExternalId,
        ErrorReason = entity.ErrorReason,
        RetryCount = entity.RetryCount,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified
      });
    }

    public async Task<ProcessingLog> Create(ProcessingLog item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.ProcessingLog
      {
        Id = item.Id,
        EntityType = item.EntityType,
        OpportunityId = item.OpportunityId,
        PartnerId = item.PartnerId,
        Action = item.Action,
        StatusId = item.StatusId,
        EntityExternalId = item.EntityExternalId,
        ErrorReason = item.ErrorReason,
        RetryCount = item.RetryCount,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.PartnerSharingProcessingLog.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<List<ProcessingLog>> Create(List<ProcessingLog> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var entities = items.Select(item =>
         new Entities.ProcessingLog
         {
           Id = item.Id,
           EntityType = item.EntityType,
           OpportunityId = item.OpportunityId,
           PartnerId = item.PartnerId,
           Action = item.Action,
           StatusId = item.StatusId,
           EntityExternalId = item.EntityExternalId,
           ErrorReason = item.ErrorReason,
           RetryCount = item.RetryCount,
           DateCreated = DateTimeOffset.UtcNow,
           DateModified = DateTimeOffset.UtcNow
         });

      _context.PartnerSharingProcessingLog.AddRange(entities);
      await _context.SaveChangesAsync();

      items = items.Zip(entities, (item, entity) =>
      {
        item.Id = entity.Id;
        item.DateCreated = entity.DateCreated;
        item.DateModified = entity.DateModified;
        return item;
      }).ToList();

      return items;
    }

    public async Task<ProcessingLog> Update(ProcessingLog item)
    {
      var entity = _context.PartnerSharingProcessingLog.Where(o => o.Id == item.Id).SingleOrDefault()
         ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.ProcessingLog)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.StatusId = item.StatusId;
      entity.EntityExternalId = item.EntityExternalId;
      entity.ErrorReason = item.ErrorReason;
      entity.RetryCount = item.RetryCount;
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task<List<ProcessingLog>> Update(List<ProcessingLog> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var itemIds = items.Select(o => o.Id).ToList();
      var entities = _context.PartnerSharingProcessingLog.Where(o => itemIds.Contains(o.Id));

      foreach (var item in items)
      {
        var entity = entities.SingleOrDefault(o => o.Id == item.Id) ?? throw new InvalidOperationException($"{nameof(ProcessingLog)} with id '{item.Id}' does not exist");

        item.DateModified = DateTimeOffset.UtcNow;

        entity.StatusId = item.StatusId;
        entity.EntityExternalId = item.EntityExternalId;
        entity.ErrorReason = item.ErrorReason;
        entity.RetryCount = item.RetryCount;
        entity.DateModified = item.DateModified;
      }

      _context.PartnerSharingProcessingLog.UpdateRange(entities);
      await _context.SaveChangesAsync();

      return items;
    }

    public Task Delete(ProcessingLog item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
