using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Opportunity.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Repositories.Lookups
{
    public class OpportunityStatusRepository : BaseRepository<Entities.Lookups.OpportunityStatus, Guid>, IRepository<OpportunityStatus>
    {
        #region Constructor
        public OpportunityStatusRepository(ApplicationDbContext context) : base(context)
        {
        }
        #endregion

        #region Public Members
        public IQueryable<OpportunityStatus> Query()
        {
            return _context.OpportunityStatus.Select(entity => new OpportunityStatus
            {
                Id = entity.Id,
                Name = entity.Name
            });
        }

        public Task<OpportunityStatus> Create(OpportunityStatus item)
        {
            throw new NotImplementedException();
        }

        public Task<OpportunityStatus> Update(OpportunityStatus item)
        {
            throw new NotImplementedException();
        }

        public Task Delete(OpportunityStatus item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
