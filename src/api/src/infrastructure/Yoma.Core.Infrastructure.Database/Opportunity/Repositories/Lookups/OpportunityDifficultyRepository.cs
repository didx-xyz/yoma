using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Opportunity.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Repositories.Lookups
{
    public class OpportunityDifficultyRepository : BaseRepository<Entities.Lookups.OpportunityDifficulty>, IRepository<OpportunityDifficulty>
    {
        #region Constructor
        public OpportunityDifficultyRepository(ApplicationDbContext context) : base(context)
        {
        }
        #endregion

        #region Public Members
        public IQueryable<OpportunityDifficulty> Query()
        {
            return _context.OpportunityDifficulty.Select(entity => new OpportunityDifficulty
            {
                Id = entity.Id,
                Name = entity.Name
            });
        }

        public Task<OpportunityDifficulty> Create(OpportunityDifficulty item)
        {
            throw new NotImplementedException();
        }

        public Task<OpportunityDifficulty> Update(OpportunityDifficulty item)
        {
            throw new NotImplementedException();
        }
        public Task Delete(OpportunityDifficulty item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
