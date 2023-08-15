using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;

namespace Yoma.Core.Infrastructure.Database.Lookups.Repositories
{
  public class CountryRepository : BaseRepository<Country>, IRepository<Domain.Lookups.Models.Country>
  {
    #region Constructor
    public CountryRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<Domain.Lookups.Models.Country> Query()
    {
      return _context.Country.Select(entity => new Domain.Lookups.Models.Country
      {
        Id = entity.Id,
        CodeAlpha2 = entity.CodeAlpha2,
        CodeAlpha3 = entity.CodeAlpha3,
        CodeNumeric = entity.CodeNumeric,
        Name = entity.Name
      });
    }

    public Task<Domain.Lookups.Models.Country> Create(Domain.Lookups.Models.Country item)
    {
      throw new NotImplementedException();
    }

    public Task Update(Domain.Lookups.Models.Country item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(Domain.Lookups.Models.Country item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
