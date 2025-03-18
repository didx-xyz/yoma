using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Infrastructure.Database.Context;

namespace Yoma.Core.Infrastructure.Database.Core.Repositories
{
  public class DownloadScheduleRepository : BaseRepository<Entities.DownloadSchedule, Guid>, IRepositoryBatched<DownloadSchedule>
  {
    #region Constructor
    public DownloadScheduleRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<DownloadSchedule> Query()
    {
      return _context.DownloadSchedule.Select(entity => new DownloadSchedule
      {
        Id = entity.Id,
        UserId = entity.UserId,
        Type = entity.Type,
        Filter = entity.Filter,
        FilterHash = entity.FilterHash,
        StatusId = entity.StatusId,
        Status = Enum.Parse<DownloadScheduleStatus>(entity.Status.Name, true),
        FileId = entity.FileId,
        FileStorageType = entity.File == null ? null : Enum.Parse<StorageType>(entity.File.StorageType, true),
        FileKey = entity.File == null ? null : entity.File.Key,
        ErrorReason = entity.ErrorReason,
        RetryCount = entity.RetryCount,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified
      });
    }
    public async Task<DownloadSchedule> Create(DownloadSchedule item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.DownloadSchedule
      {
        Id = item.Id,
        UserId = item.UserId,
        Type = item.Type,
        Filter = item.Filter,
        FilterHash = item.FilterHash,
        StatusId = item.StatusId,
        FileId = item.FileId,
        ErrorReason = item.ErrorReason,
        RetryCount = item.RetryCount,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.DownloadSchedule.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<List<DownloadSchedule>> Create(List<DownloadSchedule> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var entities = items.Select(item =>
      new Entities.DownloadSchedule
      {
        Id = item.Id,
        UserId = item.UserId,
        Type = item.Type,
        Filter = item.Filter,
        FilterHash = item.FilterHash,
        StatusId = item.StatusId,
        FileId = item.FileId,
        ErrorReason = item.ErrorReason,
        RetryCount = item.RetryCount,
        DateCreated = DateTimeOffset.UtcNow,
        DateModified = DateTimeOffset.UtcNow
      });

      _context.DownloadSchedule.AddRange(entities);
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

    public async Task<DownloadSchedule> Update(DownloadSchedule item)
    {
      var entity = _context.DownloadSchedule.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.DownloadSchedule)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.StatusId = item.StatusId;
      entity.FileId = item.FileId;
      entity.ErrorReason = item.ErrorReason;
      entity.RetryCount = item.RetryCount;
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task<List<DownloadSchedule>> Update(List<DownloadSchedule> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var itemIds = items.Select(o => o.Id).ToList();
      var entities = _context.DownloadSchedule.Where(o => itemIds.Contains(o.Id));

      foreach (var item in items)
      {
        var entity = entities.SingleOrDefault(o => o.Id == item.Id) ?? throw new InvalidOperationException($"{nameof(Entities.DownloadSchedule)} with id '{item.Id}' does not exist");

        item.DateModified = DateTimeOffset.UtcNow;

        entity.StatusId = item.StatusId;
        entity.FileId = item.FileId;
        entity.ErrorReason = item.ErrorReason;
        entity.RetryCount = item.RetryCount;
        entity.DateModified = item.DateModified;
      }

      _context.DownloadSchedule.UpdateRange(entities);
      await _context.SaveChangesAsync();

      return items;
    }

    public Task Delete(DownloadSchedule item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
