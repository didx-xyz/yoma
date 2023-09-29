using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Opportunity.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Repositories.Lookups
{
    public class OpportunityTypeRepository : BaseRepository<Entities.Lookups.OpportunityType, Guid>, IRepository<OpportunityType>
    {
        #region Constructor
        public OpportunityTypeRepository(ApplicationDbContext context) : base(context)
        {
        }
        #endregion

        #region Public Members
        public IQueryable<OpportunityType> Query()
        {
            return _context.OpportunityType.Select(entity => new OpportunityType
            {
                Id = entity.Id,
                Name = entity.Name
            });
        }

        public Task<OpportunityType> Create(OpportunityType item)
        {
            throw new NotImplementedException();
        }

        public Task<OpportunityType> Update(OpportunityType item)
        {
            throw new NotImplementedException();
        }
        public Task Delete(OpportunityType item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
