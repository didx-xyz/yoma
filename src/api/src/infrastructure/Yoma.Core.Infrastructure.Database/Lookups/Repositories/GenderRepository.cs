using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;

namespace Yoma.Core.Infrastructure.Database.Lookups.Repositories
{
  public class GenderRepository : BaseRepository<Gender, Guid>, IRepository<Domain.Lookups.Models.Gender>
  {
    #region Constructor
    public GenderRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<Domain.Lookups.Models.Gender> Query()
    {
      return _context.Gender.Select(entity => new Domain.Lookups.Models.Gender
      {
        Id = entity.Id,
        Name = entity.Name
      });
    }

    public Task<Domain.Lookups.Models.Gender> Create(Domain.Lookups.Models.Gender item)
    {
      throw new NotImplementedException();
    }

    public Task<Domain.Lookups.Models.Gender> Update(Domain.Lookups.Models.Gender item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(Domain.Lookups.Models.Gender item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
