using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Entity.Repositories
{
  public class UserPreferenceEngagementTypeRepository : BaseRepository<Entities.UserPreferenceEngagementType, Guid>,
    IRepository<Domain.Entity.Models.UserPreferenceEngagementType>
  {
    #region Constructor
    public UserPreferenceEngagementTypeRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Domain.Entity.Models.UserPreferenceEngagementType> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<Domain.Entity.Models.UserPreferenceEngagementType> Query()
    {
      return _context.UserPreferenceEngagementTypes.Select(entity => new Domain.Entity.Models.UserPreferenceEngagementType
      {
        Id = entity.Id,
        UserId = entity.UserId,
        EngagementTypeId = entity.EngagementTypeId,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<Domain.Entity.Models.UserPreferenceEngagementType> Create(Domain.Entity.Models.UserPreferenceEngagementType item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;

      var entity = new Entities.UserPreferenceEngagementType
      {
        Id = item.Id,
        UserId = item.UserId,
        EngagementTypeId = item.EngagementTypeId,
        DateCreated = item.DateCreated
      };

      _context.UserPreferenceEngagementTypes.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;

      return item;
    }

    public Task<Domain.Entity.Models.UserPreferenceEngagementType> Update(Domain.Entity.Models.UserPreferenceEngagementType item)
    {
      throw new NotImplementedException();
    }

    public async Task Delete(Domain.Entity.Models.UserPreferenceEngagementType item)
    {
      var entity = _context.UserPreferenceEngagementTypes.SingleOrDefault(value => value.Id == item.Id)
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"User preference engagement type with id '{item.Id}' does not exist");

      _context.UserPreferenceEngagementTypes.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
