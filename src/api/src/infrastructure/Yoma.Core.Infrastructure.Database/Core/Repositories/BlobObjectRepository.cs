using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.Core.Repositories
{
  public class BlobObjectRepository : BaseRepository<BlobObject, Guid>, IRepository<Domain.Core.Models.BlobObject>
  {
    #region Class Variables
    #endregion

    #region Constructor
    public BlobObjectRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<Domain.Core.Models.BlobObject> Query()
    {
      return _context.BlobObject.Select(entity => new Domain.Core.Models.BlobObject
      {
        Id = entity.Id,
        StorageType = Enum.Parse<StorageType>(entity.StorageType),
        FileType = Enum.Parse<FileType>(entity.FileType),
        Key = entity.Key,
        ContentType = entity.ContentType,
        OriginalFileName = entity.OriginalFileName,
        ParentId = entity.ParentId,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<Domain.Core.Models.BlobObject> Create(Domain.Core.Models.BlobObject item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;

      var entity = new BlobObject
      {
        Id = item.Id,
        StorageType = item.StorageType.ToString(),
        FileType = item.FileType.ToString(),
        Key = item.Key,
        ContentType = item.ContentType,
        OriginalFileName = item.OriginalFileName,
        ParentId = item.ParentId,
        DateCreated = item.DateCreated
      };

      _context.BlobObject.Add(entity);
      item.Id = entity.Id;

      await _context.SaveChangesAsync();
      return item;
    }

    public async Task<Domain.Core.Models.BlobObject> Update(Domain.Core.Models.BlobObject item)
    {
      var entity = _context.BlobObject.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(BlobObject)} with id '{item.Id}' does not exist");

      entity.ParentId = item.ParentId;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task Delete(Domain.Core.Models.BlobObject item)
    {
      var entity = _context.BlobObject.Where(o => o.Id == item.Id).SingleOrDefault() ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(BlobObject)} with id '{item.Id}' does not exist");
      _context.BlobObject.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
