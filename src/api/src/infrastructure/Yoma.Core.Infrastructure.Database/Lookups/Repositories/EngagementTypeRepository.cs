using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;

namespace Yoma.Core.Infrastructure.Database.Lookups.Repositories
{
  public class EngagementTypeRepository : BaseRepository<EngagementType, Guid>, IRepository<Domain.Lookups.Models.EngagementType>
  {
    #region Constructor
    public EngagementTypeRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<Domain.Lookups.Models.EngagementType> Query()
    {
      return _context.EngagementType.Select(entity => new Domain.Lookups.Models.EngagementType
      {
        Id = entity.Id,
        Name = entity.Name
      });
    }

    public Task<Domain.Lookups.Models.EngagementType> Create(Domain.Lookups.Models.EngagementType item)
    {
      throw new NotImplementedException();
    }

    public Task<Domain.Lookups.Models.EngagementType> Update(Domain.Lookups.Models.EngagementType item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(Domain.Lookups.Models.EngagementType item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
