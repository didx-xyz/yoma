using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Marketplace.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Marketplace.Repositories.Lookup
{
    public class TransactionStatusRepository : BaseRepository<Entities.Lookups.TransactionStatus, Guid>, IRepository<TransactionStatus>
    {
        #region Constructor
        public TransactionStatusRepository(ApplicationDbContext context) : base(context)
        {
        }
        #endregion

        #region Public Members
        public IQueryable<TransactionStatus> Query()
        {
            return _context.TransactionStatus.Select(entity => new TransactionStatus
            {
                Id = entity.Id,
                Name = entity.Name
            });
        }

        public Task<TransactionStatus> Create(TransactionStatus item)
        {
            throw new NotImplementedException();
        }

        public Task<TransactionStatus> Update(TransactionStatus item)
        {
            throw new NotImplementedException();
        }

        public Task Delete(TransactionStatus item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
