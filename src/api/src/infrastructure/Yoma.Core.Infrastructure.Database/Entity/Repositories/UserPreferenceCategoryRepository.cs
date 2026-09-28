using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Entity.Repositories
{
  public class UserPreferenceCategoryRepository : BaseRepository<UserPreferenceCategory, Guid>,
    IRepository<Domain.Entity.Models.UserPreferenceCategory>
  {
    #region Constructor
    public UserPreferenceCategoryRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Domain.Entity.Models.UserPreferenceCategory> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<Domain.Entity.Models.UserPreferenceCategory> Query()
    {
      return _context.UserPreferenceCategories.Select(entity => new Domain.Entity.Models.UserPreferenceCategory
      {
        Id = entity.Id,
        UserId = entity.UserId,
        CategoryId = entity.CategoryId,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<Domain.Entity.Models.UserPreferenceCategory> Create(Domain.Entity.Models.UserPreferenceCategory item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;

      var entity = new UserPreferenceCategory
      {
        Id = item.Id,
        UserId = item.UserId,
        CategoryId = item.CategoryId,
        DateCreated = item.DateCreated
      };

      _context.UserPreferenceCategories.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public Task<Domain.Entity.Models.UserPreferenceCategory> Update(Domain.Entity.Models.UserPreferenceCategory item)
    {
      throw new NotImplementedException();
    }

    public async Task Delete(Domain.Entity.Models.UserPreferenceCategory item)
    {
      var entity = _context.UserPreferenceCategories.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(UserPreferenceCategory)} with id '{item.Id}' does not exist");
      _context.UserPreferenceCategories.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
