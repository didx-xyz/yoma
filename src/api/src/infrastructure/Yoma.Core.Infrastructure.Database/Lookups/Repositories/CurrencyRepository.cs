using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Lookups.Repositories
{
  public class CurrencyRepository : BaseRepository<Entities.Currency, Guid>,
    IRepository<Domain.Lookups.Models.Currency>
  {
    #region Constructor
    public CurrencyRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Domain.Lookups.Models.Currency> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<Domain.Lookups.Models.Currency> Query()
    {
      return _context.Currency.Select(entity => new Domain.Lookups.Models.Currency
      {
        Id = entity.Id,
        Code = entity.Code,
        Name = entity.Name
      });
    }

    public Task<Domain.Lookups.Models.Currency> Create(Domain.Lookups.Models.Currency item)
    {
      throw new NotImplementedException();
    }

    public Task<Domain.Lookups.Models.Currency> Update(Domain.Lookups.Models.Currency item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(Domain.Lookups.Models.Currency item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
