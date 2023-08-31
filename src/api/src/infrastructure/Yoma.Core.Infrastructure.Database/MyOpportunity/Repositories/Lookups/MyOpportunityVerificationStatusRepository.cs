using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.MyOpportunity.Repositories.Lookups
{
    public class MyOpportunityVerificationStatusRepository : BaseRepository<Entities.Lookups.MyOpportunityVerificationStatus>, IRepository<MyOpportunityVerificationStatus>
    {
        #region Constructor
        public MyOpportunityVerificationStatusRepository(ApplicationDbContext context) : base(context)
        {
        }
        #endregion

        #region Public Members
        public IQueryable<MyOpportunityVerificationStatus> Query()
        {
            return _context.MyOpportunityVerificationStatus.Select(entity => new MyOpportunityVerificationStatus
            {
                Id = entity.Id,
                Name = entity.Name
            });
        }

        public Task<MyOpportunityVerificationStatus> Create(MyOpportunityVerificationStatus item)
        {
            throw new NotImplementedException();
        }

        public Task Update(MyOpportunityVerificationStatus item)
        {
            throw new NotImplementedException();
        }

        public Task Delete(MyOpportunityVerificationStatus item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
