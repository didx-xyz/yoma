using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.SSI.Repositories.Lookups
{
    public class SSIWalletCreationStatusRepository : BaseRepository<Entities.Lookups.SSIWalletCreationStatus, Guid>, IRepository<SSIWalletCreationStatus>
    {
        #region Constructor
        public SSIWalletCreationStatusRepository(ApplicationDbContext context) : base(context)
        {
        }
        #endregion

        #region Public Members
        public IQueryable<SSIWalletCreationStatus> Query()
        {
            return _context.SSIWalletCreationStatus.Select(entity => new SSIWalletCreationStatus
            {
                Id = entity.Id,
                Name = entity.Name
            });
        }

        public Task<SSIWalletCreationStatus> Create(SSIWalletCreationStatus item)
        {
            throw new NotImplementedException();
        }

        public Task<SSIWalletCreationStatus> Update(SSIWalletCreationStatus item)
        {
            throw new NotImplementedException();
        }

        public Task Delete(SSIWalletCreationStatus item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}

