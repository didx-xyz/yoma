using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.MyOpportunity.Repositories.Lookups
{
    public class MyOpportunityActionRepository : BaseRepository<Entities.Lookups.MyOpportunityAction>, IRepository<MyOpportunityAction>
    {
        #region Constructor
        public MyOpportunityActionRepository(ApplicationDbContext context) : base(context)
        {
        }
        #endregion

        #region Public Members
        public IQueryable<MyOpportunityAction> Query()
        {
            return _context.MyOpportunityAction.Select(entity => new MyOpportunityAction
            {
                Id = entity.Id,
                Name = entity.Name
            });
        }

        public Task<MyOpportunityAction> Create(MyOpportunityAction item)
        {
            throw new NotImplementedException();
        }

        public Task<MyOpportunityAction> Update(MyOpportunityAction item)
        {
            throw new NotImplementedException();
        }

        public Task Delete(MyOpportunityAction item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
