using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Core.Repositories
{
  public sealed class CustomFieldOptionRepository : BaseRepository<Entities.CustomFieldOption, Guid>, IRepository<Domain.Core.Models.CustomFieldOption>
  {
    #region Constructor
    public CustomFieldOptionRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<Domain.Core.Models.CustomFieldOption> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<Domain.Core.Models.CustomFieldOption> Query()
    {
      return _context.CustomFieldOption.Select(entity => new Domain.Core.Models.CustomFieldOption
      {
        Id = entity.Id,
        CustomFieldDefinitionId = entity.CustomFieldDefinitionId,
        Key = entity.Key,
        Name = entity.Name,
        SortOrder = entity.SortOrder,
        IsActive = entity.IsActive,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified
      });
    }

    public async Task<Domain.Core.Models.CustomFieldOption> Create(Domain.Core.Models.CustomFieldOption item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.CustomFieldOption
      {
        Id = item.Id,
        CustomFieldDefinitionId = item.CustomFieldDefinitionId,
        Key = item.Key,
        Name = item.Name,
        SortOrder = item.SortOrder,
        IsActive = item.IsActive,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.CustomFieldOption.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;

      return item;
    }

    public async Task<Domain.Core.Models.CustomFieldOption> Update(Domain.Core.Models.CustomFieldOption item)
    {
      var entity = _context.CustomFieldOption.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Core.Entities.CustomFieldOption)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.CustomFieldDefinitionId = item.CustomFieldDefinitionId;
      entity.Key = item.Key;
      entity.Name = item.Name;
      entity.SortOrder = item.SortOrder;
      entity.IsActive = item.IsActive;
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task Delete(Domain.Core.Models.CustomFieldOption item)
    {
      var entity = _context.CustomFieldOption.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Core.Entities.CustomFieldOption)} with id '{item.Id}' does not exist");

      _context.CustomFieldOption.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
