using Microsoft.EntityFrameworkCore;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Entity.Repositories
{
  public class UserSkillRepository : BaseRepository<UserSkill, Guid>, IRepository<Domain.Entity.Models.UserSkill>
  {
    #region Constructor
    public UserSkillRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Domain.Entity.Models.UserSkill> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<Domain.Entity.Models.UserSkill> Query()
    {
      return _context.UserSkills.Select(entity => new Domain.Entity.Models.UserSkill
      {
        Id = entity.Id,
        UserId = entity.UserId,
        SkillId = entity.SkillId,
        Type = Enum.Parse<Domain.Entity.UserSkillType>(entity.Type),
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified
      });
    }

    public async Task<Domain.Entity.Models.UserSkill> Create(Domain.Entity.Models.UserSkill item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = item.DateCreated;

      var entity = new UserSkill
      {
        Id = item.Id,
        UserId = item.UserId,
        SkillId = item.SkillId,
        Type = item.Type.ToString(),
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.UserSkills.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<Domain.Entity.Models.UserSkill> Update(Domain.Entity.Models.UserSkill item)
    {
      var entity = _context.UserSkills.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(UserSkill)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.Type = item.Type.ToString();
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task Delete(Domain.Entity.Models.UserSkill item)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      // A completion may promote the skill after the service checked its type.
      // Keep the deletion conditional so a verified skill can never be removed by that race.
      var deleted = await _context.UserSkills
        .Where(o => o.Id == item.Id && o.UserId == item.UserId && o.Type == Domain.Entity.UserSkillType.SelfAttested.ToString())
        .ExecuteDeleteAsync();
      if (deleted == 0)
        throw new InvalidOperationException($"{nameof(UserSkill)} with id '{item.Id}' does not exist or is no longer self-attested");
    }
    #endregion
  }
}
