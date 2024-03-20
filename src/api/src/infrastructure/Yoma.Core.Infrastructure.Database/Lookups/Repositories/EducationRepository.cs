using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;

namespace Yoma.Core.Infrastructure.Database.Lookups.Repositories
{
  public class EducationRepository : BaseRepository<Education, Guid>, IRepository<Domain.Lookups.Models.Education>
  {
    #region Constructor
    public EducationRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<Domain.Lookups.Models.Education> Query()
    {
      return _context.Education.Select(entity => new Domain.Lookups.Models.Education
      {
        Id = entity.Id,
        Name = entity.Name
      });
    }

    public Task<Domain.Lookups.Models.Education> Create(Domain.Lookups.Models.Education item)
    {
      throw new NotImplementedException();
    }

    public Task<Domain.Lookups.Models.Education> Update(Domain.Lookups.Models.Education item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(Domain.Lookups.Models.Education item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
