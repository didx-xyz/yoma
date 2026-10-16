using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Lookups.Repositories
{
  public class AccessibilityRepository : BaseRepository<Entities.Accessibility, Guid>,
    IRepository<Domain.Lookups.Models.Accessibility>
  {
    #region Constructor
    public AccessibilityRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Domain.Lookups.Models.Accessibility> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<Domain.Lookups.Models.Accessibility> Query()
    {
      return _context.Accessibility.Select(entity => new Domain.Lookups.Models.Accessibility
      {
        Id = entity.Id,
        Name = entity.Name
      });
    }

    public Task<Domain.Lookups.Models.Accessibility> Create(Domain.Lookups.Models.Accessibility item)
    {
      throw new NotImplementedException();
    }

    public Task<Domain.Lookups.Models.Accessibility> Update(Domain.Lookups.Models.Accessibility item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(Domain.Lookups.Models.Accessibility item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
