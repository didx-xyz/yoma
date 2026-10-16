using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Entity.Repositories
{
  public class UserPreferenceLanguageRepository : BaseRepository<Entities.UserPreferenceLanguage, Guid>,
    IRepository<Domain.Entity.Models.UserPreferenceLanguage>
  {
    #region Constructor
    public UserPreferenceLanguageRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Domain.Entity.Models.UserPreferenceLanguage> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<Domain.Entity.Models.UserPreferenceLanguage> Query()
    {
      return _context.UserPreferenceLanguages.Select(entity => new Domain.Entity.Models.UserPreferenceLanguage
      {
        Id = entity.Id,
        UserId = entity.UserId,
        LanguageId = entity.LanguageId,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<Domain.Entity.Models.UserPreferenceLanguage> Create(Domain.Entity.Models.UserPreferenceLanguage item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      var entity = new Entities.UserPreferenceLanguage
      {
        Id = item.Id,
        UserId = item.UserId,
        LanguageId = item.LanguageId,
        DateCreated = item.DateCreated
      };
      _context.UserPreferenceLanguages.Add(entity);
      await _context.SaveChangesAsync();
      item.Id = entity.Id;
      return item;
    }

    public Task<Domain.Entity.Models.UserPreferenceLanguage> Update(Domain.Entity.Models.UserPreferenceLanguage item)
    {
      throw new NotImplementedException();
    }

    public async Task Delete(Domain.Entity.Models.UserPreferenceLanguage item)
    {
      var entity = _context.UserPreferenceLanguages.SingleOrDefault(value => value.Id == item.Id)
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"User preference language with id '{item.Id}' does not exist");

      _context.UserPreferenceLanguages.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
