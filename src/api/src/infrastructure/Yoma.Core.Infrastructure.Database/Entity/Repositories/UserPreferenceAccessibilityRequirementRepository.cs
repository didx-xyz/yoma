using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Entity.Repositories
{
  public class UserPreferenceAccessibilityRequirementRepository : BaseRepository<UserPreferenceAccessibilityRequirement, Guid>,
    IRepository<Domain.Entity.Models.UserPreferenceAccessibilityRequirement>
  {
    #region Constructor
    public UserPreferenceAccessibilityRequirementRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Domain.Entity.Models.UserPreferenceAccessibilityRequirement> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<Domain.Entity.Models.UserPreferenceAccessibilityRequirement> Query()
    {
      return _context.UserPreferenceAccessibilityRequirements.Select(entity => new Domain.Entity.Models.UserPreferenceAccessibilityRequirement
      {
        Id = entity.Id,
        UserId = entity.UserId,
        AccessibilityId = entity.AccessibilityId,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<Domain.Entity.Models.UserPreferenceAccessibilityRequirement> Create(Domain.Entity.Models.UserPreferenceAccessibilityRequirement item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      var entity = new UserPreferenceAccessibilityRequirement
      {
        Id = item.Id,
        UserId = item.UserId,
        AccessibilityId = item.AccessibilityId,
        DateCreated = item.DateCreated
      };
      _context.UserPreferenceAccessibilityRequirements.Add(entity);
      await _context.SaveChangesAsync();
      item.Id = entity.Id;
      return item;
    }

    public Task<Domain.Entity.Models.UserPreferenceAccessibilityRequirement> Update(Domain.Entity.Models.UserPreferenceAccessibilityRequirement item)
    {
      throw new NotImplementedException();
    }

    public async Task Delete(Domain.Entity.Models.UserPreferenceAccessibilityRequirement item)
    {
      var entity = _context.UserPreferenceAccessibilityRequirements.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(UserPreferenceAccessibilityRequirement)} with id '{item.Id}' does not exist");
      _context.UserPreferenceAccessibilityRequirements.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
