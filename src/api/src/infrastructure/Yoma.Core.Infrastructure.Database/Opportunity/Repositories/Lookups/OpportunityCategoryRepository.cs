using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Opportunity.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Repositories.Lookups
{
  public class OpportunityCategoryRepository : BaseRepository<Entities.Lookups.OpportunityCategory>, IRepository<OpportunityCategory>
  {
    #region Constructor
    public OpportunityCategoryRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<OpportunityCategory> Query()
    {
      return _context.OpportunityCategory.Select(entity => new OpportunityCategory
      {
        Id = entity.Id,
        Name = entity.Name
      });
    }

    public Task<OpportunityCategory> Create(OpportunityCategory item)
    {
      throw new NotImplementedException();
    }

    public Task Update(OpportunityCategory item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(OpportunityCategory item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
